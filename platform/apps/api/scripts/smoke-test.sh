#!/usr/bin/env bash
# End-to-end smoke test against a running API (default http://localhost:4000).
# Usage: npm run db:reset && npm run dev   (in another terminal)  then  bash scripts/smoke-test.sh
set -euo pipefail
API="${API:-http://localhost:4000/api}"
pass=0; fail=0

check() { # name expected_status actual_status
  if [[ "$2" == "$3" ]]; then echo "  ✔ $1"; pass=$((pass+1)); else echo "  ✘ $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}
req() { # method path token body -> sets BODY and CODE
  local out
  out=$(curl -s -w $'\n%{http_code}' -X "$1" "$API$2" -H "Content-Type: application/json" ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"})
  CODE="${out##*$'\n'}"; BODY="${out%$'\n'*}"
}
json() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const o=JSON.parse(d);console.log($1)})" <<<"$BODY"; }

echo "Health"
req GET /health; check "health" 200 "$CODE"

echo "Auth"
req POST /auth/login "" '{"email":"admin@medislot.dev","password":"Admin@123","role":"admin"}'; check "admin login" 200 "$CODE"; ADMIN=$(json o.token)
req POST /auth/login "" '{"email":"vikram.mehta@medislot.dev","password":"Doctor@123","role":"doctor"}'; check "doctor login" 200 "$CODE"; DOCTOR=$(json o.token)
req POST /auth/login "" '{"email":"patient@medislot.dev","password":"Patient@123","role":"patient"}'; check "patient login" 200 "$CODE"; PATIENT=$(json o.token)
req POST /auth/login "" '{"email":"patient@medislot.dev","password":"wrong","role":"patient"}'; check "wrong password rejected" 401 "$CODE"
req POST /auth/login "" '{"email":"patient@medislot.dev","password":"Patient@123","role":"admin"}'; check "patient blocked from admin app" 403 "$CODE"
EMAIL="new.$RANDOM$RANDOM@example.com"
req POST /auth/register "" "{\"name\":\"Test Patient\",\"email\":\"$EMAIL\",\"password\":\"secret123\"}"; check "patient registration" 201 "$CODE"; NEWPAT=$(json o.token)
req POST /auth/register "" "{\"name\":\"Test Patient\",\"email\":\"$EMAIL\",\"password\":\"secret123\"}"; check "duplicate email rejected" 409 "$CODE"

echo "Access control"
req GET /admin/stats "$PATIENT"; check "patient can't read admin stats" 403 "$CODE"
req GET /doctor/appointments "$PATIENT"; check "patient can't read doctor schedule" 403 "$CODE"
req GET /patient/appointments; check "no token -> 401" 401 "$CODE"

echo "Catalog"
req GET /specialties; check "specialties" 200 "$CODE"
req GET "/doctors?search=mehta"; check "doctor search" 200 "$CODE"; DOC_ID=$(json o[0].id)
TOMORROW=$(node -e "const d=new Date(Date.now()+864e5*2);console.log(d.toISOString().slice(0,10))")
for i in 0 1 2 3 4 5 6; do
  DATE=$(node -e "const d=new Date(Date.now()+864e5*(2+$i));console.log(d.toISOString().slice(0,10))")
  req GET "/doctors/$DOC_ID/slots?date=$DATE"
  SLOT=$(json "(o.slots.find(s=>s.available)||{}).time||''")
  [[ -n "$SLOT" ]] && break
done
check "found a free slot ($DATE $SLOT)" 1 "$([[ -n "$SLOT" ]] && echo 1 || echo 0)"

echo "Booking (shared DB: patient books -> doctor & admin see it)"
req POST /patient/appointments "$NEWPAT" "{\"doctorId\":$DOC_ID,\"date\":\"$DATE\",\"startTime\":\"$SLOT\",\"reason\":\"Smoke test\"}"; check "book appointment" 201 "$CODE"; APPT=$(json o.id)
req POST /patient/appointments "$PATIENT" "{\"doctorId\":$DOC_ID,\"date\":\"$DATE\",\"startTime\":\"$SLOT\"}"; check "double booking blocked" 409 "$CODE"
req GET "/doctors/$DOC_ID/slots?date=$DATE"; check "slot now unavailable" false "$(json "o.slots.find(s=>s.time==='$SLOT').available")"
req GET "/doctor/appointments?date=$DATE" "$DOCTOR"; check "doctor sees new booking" 1 "$(json "o.filter(a=>a.id===$APPT).length")"
req GET "/admin/appointments?from=$DATE&to=$DATE&doctorId=$DOC_ID" "$ADMIN"; check "admin sees new booking" 1 "$(json "o.items.filter(a=>a.id===$APPT).length")"

echo "Doctor workflow"
req PATCH "/doctor/appointments/$APPT" "$DOCTOR" '{"status":"checked_in"}'; check "check in" 200 "$CODE"
req PATCH "/doctor/appointments/$APPT" "$DOCTOR" '{"status":"completed","notes":"All good","prescription":"Rest"}'; check "complete with notes" 200 "$CODE"
req PATCH "/doctor/appointments/$APPT" "$DOCTOR" '{"status":"booked"}'; check "completed is final" 409 "$CODE"
req GET /patient/appointments "$NEWPAT"; check "patient sees prescription" Rest "$(json "o.find(a=>a.id===$APPT).prescription")"
req GET /doctor/stats "$DOCTOR"; check "doctor stats" 200 "$CODE"
req GET /doctor/availability "$DOCTOR"; check "availability" 200 "$CODE"
req PUT /doctor/availability "$DOCTOR" '{"rules":[{"weekday":1,"startTime":"09:00","endTime":"12:00","slotMinutes":30},{"weekday":1,"startTime":"11:00","endTime":"13:00","slotMinutes":30}]}'; check "overlapping windows rejected" 400 "$CODE"

echo "Patient cancel"
req GET "/doctors/$DOC_ID/slots?date=$DATE"; SLOT2=$(json "(o.slots.find(s=>s.available)||{}).time||''")
req POST /patient/appointments "$NEWPAT" "{\"doctorId\":$DOC_ID,\"date\":\"$DATE\",\"startTime\":\"$SLOT2\"}"; APPT2=$(json o.id)
req POST "/patient/appointments/$APPT2/cancel" "$NEWPAT"; check "cancel" cancelled "$(json o.status)"
req POST "/patient/appointments/$APPT2/cancel" "$PATIENT"; check "can't cancel someone else's" 404 "$CODE"
req POST /patient/appointments "$PATIENT" "{\"doctorId\":$DOC_ID,\"date\":\"$DATE\",\"startTime\":\"$SLOT2\"}"; check "cancelled slot can be rebooked" 201 "$CODE"

echo "Admin"
for r in 7 30 90; do req GET "/admin/stats?range=$r" "$ADMIN"; check "stats range=$r" 200 "$CODE"; done
req GET "/admin/patients?search=sharma" "$ADMIN"; check "patient search" 200 "$CODE"
DEMAIL="doc.$RANDOM$RANDOM@medislot.dev"
req POST /admin/doctors "$ADMIN" "{\"name\":\"Dr. Test Doctor\",\"email\":\"$DEMAIL\",\"password\":\"secret123\",\"specialtyId\":1,\"fee\":500,\"experienceYears\":3}"; check "create doctor" 201 "$CODE"; NEWDOC=$(json o.id)
req POST /auth/login "" "{\"email\":\"$DEMAIL\",\"password\":\"secret123\",\"role\":\"doctor\"}"; check "new doctor can log in" 200 "$CODE"
req PATCH "/admin/doctors/$NEWDOC" "$ADMIN" '{"isActive":false}'; check "deactivate doctor" false "$(json o.isActive)"
req POST /auth/login "" "{\"email\":\"$DEMAIL\",\"password\":\"secret123\",\"role\":\"doctor\"}"; check "deactivated doctor blocked" 403 "$CODE"

echo; echo "Passed: $pass  Failed: $fail"
[[ $fail -eq 0 ]]
