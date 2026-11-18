import { formatToday } from "../lib/format";

export default function PageHeading({ title, role, actions, subtitle }) {
  return (
    <header className="page-heading">
      <div className="page-heading-copy">
        <h1>{title}</h1>
        <div className="page-heading-meta">
          <span className="page-heading-role">{role}</span>
          <span aria-hidden="true">·</span>
          <span className="page-heading-date">{formatToday()}</span>
        </div>
        {subtitle && <p className="page-heading-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </header>
  );
}
