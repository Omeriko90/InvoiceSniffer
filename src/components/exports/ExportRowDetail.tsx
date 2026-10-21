

interface ExportRowDetailProps {
    label: string;
    value: string;
}

function ExportRowDetail({ label, value }: ExportRowDetailProps) {
    return (
      <div className="flex flex-col gap-0.5">
        <dt className="text-sm font-semibold tracking-tight text-text-secondary">
          {label}
        </dt>
        <dd className="truncate text-text-primary">{value}</dd>
      </div>
    )
  }


  export default ExportRowDetail;