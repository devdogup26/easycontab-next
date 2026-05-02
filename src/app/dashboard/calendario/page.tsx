import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/server/prisma';
import { redirect } from 'next/navigation';
import { CalendarioClient } from './CalendarioClient';
import styles from './page.module.css';
import sharedStyles from '../_shared.module.css';

export const dynamic = 'force-dynamic';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  obligations: Obligation[];
  parcelamentos: Parcelamento[];
  certificados: Certificado[];
}

interface Obligation {
  id: string;
  tipo: string;
  clienteId: string;
  clienteNome: string;
  dataVencimento: Date | null;
  status: string;
  ano: number;
  mes: number;
}

interface Parcelamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: string;
  inicio: Date;
  total: number;
  parcelas: number;
  parcelasEmAtraso: number;
}

interface Certificado {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: string;
  validade: Date;
  status: string;
}

interface CalendarioClientProps {
  currentMonth: number;
  currentYear: number;
  calendarDays: CalendarDay[];
  monthStats: {
    overdue: number;
    dueToday: number;
    upcoming: number;
  };
  obligations: Obligation[];
  parcelamentos: Parcelamento[];
  certificados: Certificado[];
}

export default async function CalendarioPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const escritorioId = (session.user as any).escritorioId;

  // Get current date for calendar
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Fetch obligations for the current month (and nearby for context)
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const [obrigacoes, parcelamentos, certificados] = await Promise.all([
    prisma.obrigacao.findMany({
      where: {
        cliente: { escritorioId },
        dataVencimento: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        cliente: {
          select: { id: true, nomeRazao: true },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    }),
    prisma.parcelamento.findMany({
      where: {
        cliente: { escritorioId },
        inicio: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        cliente: {
          select: { id: true, nomeRazao: true },
        },
      },
    }),
    prisma.certificado.findMany({
      where: {
        cliente: { escritorioId },
        validade: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        cliente: {
          select: { id: true, nomeRazao: true },
        },
      },
    }),
  ]);

  // Transform data
  const obligationsData: Obligation[] = obrigacoes.map(o => ({
    id: o.id,
    tipo: o.tipo,
    clienteId: o.cliente.id,
    clienteNome: o.cliente.nomeRazao,
    dataVencimento: o.dataVencimento,
    status: o.status,
    ano: o.ano,
    mes: o.mes,
  }));

  const parcelamentosData: Parcelamento[] = parcelamentos.map(p => ({
    id: p.id,
    clienteId: p.cliente.id,
    clienteNome: p.cliente.nomeRazao,
    tipo: p.tipo,
    inicio: p.inicio,
    total: Number(p.total),
    parcelas: p.parcelas,
    parcelasEmAtraso: p.parcelasEmAtraso,
  }));

  const certificadosData: Certificado[] = certificados.map(c => ({
    id: c.id,
    clienteId: c.cliente.id,
    clienteNome: c.cliente.nomeRazao,
    tipo: c.tipo,
    validade: c.validade,
    status: c.status,
  }));

  // Build calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month padding
  const prevMonth = new Date(currentYear, currentMonth - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  const calendarDays: CalendarDay[] = [];

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarDays.push({
      date: new Date(currentYear, currentMonth - 2, day),
      day,
      isCurrentMonth: false,
      isToday: false,
      obligations: [],
      parcelamentos: [],
      certificados: [],
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth - 1, day);
    const isToday = day === now.getDate();

    // Filter obligations for this day
    const dayObligations = obligationsData.filter(o => {
      if (!o.dataVencimento) return false;
      const d = new Date(o.dataVencimento);
      return d.getDate() === day && d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
    });

    // Filter parcelamentos that started on this day
    const dayParcelamentos = parcelamentosData.filter(p => {
      const d = new Date(p.inicio);
      return d.getDate() === day && d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
    });

    // Filter certificados that expire on this day
    const dayCertificados = certificadosData.filter(c => {
      const d = new Date(c.validade);
      return d.getDate() === day && d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
    });

    calendarDays.push({
      date,
      day,
      isCurrentMonth: true,
      isToday,
      obligations: dayObligations,
      parcelamentos: dayParcelamentos,
      certificados: dayCertificados,
    });
  }

  // Next month days
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      date: new Date(currentYear, currentMonth, day),
      day,
      isCurrentMonth: false,
      isToday: false,
      obligations: [],
      parcelamentos: [],
      certificados: [],
    });
  }

  // Calculate month stats
  const today = now.toDateString();
  const overdue = obligationsData.filter(o => {
    if (!o.dataVencimento) return false;
    return new Date(o.dataVencimento).toDateString() < today && o.status !== 'ENTREGUE';
  }).length;
  const dueToday = obligationsData.filter(o => {
    if (!o.dataVencimento) return false;
    return new Date(o.dataVencimento).toDateString() === today && o.status !== 'ENTREGUE';
  }).length;
  const upcoming = obligationsData.filter(o => {
    if (!o.dataVencimento) return false;
    return new Date(o.dataVencimento).toDateString() > today;
  }).length;

  const monthStats = { overdue, dueToday, upcoming };

  return (
    <div className={sharedStyles.page}>
      <div className={sharedStyles.header}>
        <div className={sharedStyles.headerContent}>
          <h1 className={sharedStyles.title}>Calendário Fiscal</h1>
          <p className={sharedStyles.subtitle}>
            Visão geral das obrigações e prazos do mês
          </p>
        </div>
      </div>

      <CalendarioClient
        currentMonth={currentMonth}
        currentYear={currentYear}
        calendarDays={calendarDays}
        monthStats={monthStats}
        obligations={obligationsData}
        parcelamentos={parcelamentosData}
        certificados={certificadosData}
      />
    </div>
  );
}
