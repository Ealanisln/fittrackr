export function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color
}: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-white text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <Icon className="text-white/80" size={32} />
      </div>
    </div>
  );
}
