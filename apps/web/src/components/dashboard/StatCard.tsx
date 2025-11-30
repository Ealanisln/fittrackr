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
    <div className={`bg-gradient-to-br ${color} p-4 md:p-6 rounded-xl shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-white/80 text-xs md:text-sm font-medium truncate">{title}</p>
          <p className="text-white text-xl md:text-3xl font-bold mt-1 md:mt-2">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1 truncate">{subtitle}</p>}
        </div>
        <Icon className="text-white/80 flex-shrink-0 ml-2" size={24} />
      </div>
    </div>
  );
}
