import { LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  activeTabName: string;
}

export default function Header({ activeTabName }: HeaderProps) {
  return (
    <header className="content-header">
      <div className="breadcrumb">
        <LayoutDashboard size={18} />
        <span>Dashboard</span> / <span className="current">{activeTabName}</span>
      </div>
      <div className="header-actions">
        <span className="status-badge">API Online</span>
      </div>
    </header>
  );
}
