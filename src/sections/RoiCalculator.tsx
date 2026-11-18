import { useState, type CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { inr, inrCompact } from "@/lib/format";

const WORKING_DAYS_PER_MONTH = 26;
const NO_SHOW_REDUCTION = 0.35;
const ONLINE_BOOKING_LIFT = 0.15;

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
}

function Slider({ id, label, value, min, max, step = 1, display, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="field-range">
      <label htmlFor={id}>
        {label} <output htmlFor={id}>{display}</output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--p": `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function RoiCalculator() {
  const [doctors, setDoctors] = useState(5);
  const [patients, setPatients] = useState(20);
  const [fee, setFee] = useState(500);
  const [noShow, setNoShow] = useState(15);

  const monthlyAppointments = doctors * patients * WORKING_DAYS_PER_MONTH;
  const recovered = monthlyAppointments * (noShow / 100) * NO_SHOW_REDUCTION;
  const newBookings = monthlyAppointments * ONLINE_BOOKING_LIFT;
  const monthly = Math.round((recovered + newBookings) * fee);

  return (
    <section className="section" id="roi">
      <div className="container roi">
        <Reveal className="roi__copy">
          <span className="eyebrow">ROI calculator</span>
          <h2>See how much revenue you're leaving on the table</h2>
          <p>Most clinics recover the cost of the platform within the first month, just from fewer no-shows and more online bookings.</p>
          <ul className="checks">
            <li>Based on a conservative {NO_SHOW_REDUCTION * 100}% reduction in no-shows</li>
            <li>Plus a {ONLINE_BOOKING_LIFT * 100}% lift in new bookings from 24/7 online booking</li>
          </ul>
        </Reveal>
        <Reveal className="roi__card">
          <Slider id="rDoctors" label="Number of doctors" value={doctors} min={1} max={50} display={String(doctors)} onChange={setDoctors} />
          <Slider id="rPatients" label="Patients per doctor / day" value={patients} min={5} max={60} display={String(patients)} onChange={setPatients} />
          <Slider id="rFee" label="Average consultation fee" value={fee} min={100} max={3000} step={50} display={inr(fee)} onChange={setFee} />
          <Slider id="rNoShow" label="Current no-show rate" value={noShow} min={2} max={40} display={`${noShow}%`} onChange={setNoShow} />
          <div className="roi__result">
            <small>Estimated extra revenue per month</small>
            <b>{inr(monthly)}</b>
            <span>≈ {inrCompact(monthly * 12)} per year</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
