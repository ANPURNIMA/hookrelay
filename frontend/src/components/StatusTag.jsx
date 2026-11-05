import { statusLabel } from '../utils/events.js'

const styles = {
  delivered: 'border-[#b7ddc4] bg-[#eff9f2] text-[#287447]',
  retrying: 'border-[#f0d29c] bg-[#fff8e8] text-[#a96913]',
  failed_dlq: 'border-[#edc0bc] bg-[#fff3f2] text-[#b14039]',
  queued: 'border-[#b9d7e8] bg-[#f0f8fc] text-[#2e6d91]',
}
export function StatusTag({ status, statusCode, attemptNumber }) {
  return <span className={`inline-flex border px-1.5 py-0.5 font-mono text-[10px] font-medium ${styles[status] ?? styles.queued}`}>
    [{statusLabel(status, statusCode, attemptNumber)}]
  </span>
}
