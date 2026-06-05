import { ChampionshipDashboard } from '@/components/championship/dashboard';

export const metadata = {
  title: 'Dashboard - Sistema de Campeonato de Fútbol',
  description: 'Gestiona equipos, fechas y partidos de tu campeonato',
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ChampionshipDashboard />
    </main>
  );
}
