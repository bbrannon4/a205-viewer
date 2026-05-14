import type { LoadedFile } from '../lib/types'
import { MetadataCard } from '../components/MetadataCard'
import { PerformancePlot } from '../components/PerformancePlot'
import { SummaryTable } from '../components/SummaryTable'

interface Props {
  files: LoadedFile[]
}

export function Rs0001View({ files }: Props) {
  return (
    <div className="space-y-6">
      <MetadataCard files={files} />
      <PerformancePlot files={files} />
      <SummaryTable files={files} />
    </div>
  )
}
