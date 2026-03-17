import { SubmitForm } from './SubmitForm'

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Daftarkan Band / Project Musik</h1>
      <p className="text-stone-500 text-sm mb-8">
        Isi form berikut untuk mendaftarkan band atau project musik kamu ke direktori Bandly.
      </p>
      <SubmitForm />
    </div>
  )
}
