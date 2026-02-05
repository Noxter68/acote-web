'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  User,
  Star,
  Eye,
  Pause,
  Trash2,
  ExternalLink,
  Briefcase,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { BookingStatus, Service } from '@/types';

type Tab = 'provider' | 'requester';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('provider');

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', tab],
    queryFn: () => api.getMyBookings(tab),
    enabled: !!user,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['my-services'],
    queryFn: () => api.getMyServices(),
    enabled: !!user,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.publishService(id),
    onSuccess: () => {
      success('Service publié !');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: () => showError('Erreur lors de la publication'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseService(id),
    onSuccess: () => {
      success('Service mis en pause');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: () => showError('Erreur lors de la mise en pause'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      success('Service supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-services'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const statusLabels: Record<BookingStatus, string> = {
    PENDING: 'En attente',
    ACCEPTED: 'Accepté',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELED: 'Annulé',
    DISPUTED: 'Litige',
  };

  const statusIcons: Record<BookingStatus, React.ReactNode> = {
    PENDING: <Clock className="w-3.5 h-3.5" />,
    ACCEPTED: <CheckCircle className="w-3.5 h-3.5" />,
    IN_PROGRESS: <Play className="w-3.5 h-3.5" />,
    COMPLETED: <CheckCircle className="w-3.5 h-3.5" />,
    CANCELED: <XCircle className="w-3.5 h-3.5" />,
    DISPUTED: <XCircle className="w-3.5 h-3.5" />,
  };

  const statusColors: Record<BookingStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    IN_PROGRESS: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
    COMPLETED: 'bg-success-soft text-success dark:bg-success/20 dark:text-success',
    CANCELED: 'bg-stone-100 text-stone-600 dark:bg-stone-800/50 dark:text-stone-400',
    DISPUTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-24">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Connectez-vous</h1>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour accéder à votre dashboard.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="rounded-xl px-8">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  const publishedServices = services?.filter((s) => s.status === 'PUBLISHED') || [];
  const pendingBookings = bookings?.filter((b) => b.status === 'PENDING') || [];

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">
                Bonjour, {user.name?.split(' ')[0] || 'là'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos services et suivez vos missions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-gold-soft text-primary">
                {user.isBusiness ? 'Professionnel' : 'Particulier'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: 'Services créés',
              value: services?.length || 0,
              icon: Briefcase,
              color: 'bg-primary/10 text-primary',
            },
            {
              label: 'Publiés',
              value: publishedServices.length,
              icon: Eye,
              color: 'bg-success-soft text-success',
            },
            {
              label: 'En attente',
              value: pendingBookings.length,
              icon: Clock,
              color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
            },
            {
              label: 'Note moyenne',
              value: user.reputation?.ratingAvg10 ? (user.reputation.ratingAvg10 / 10).toFixed(1) : '-',
              icon: Star,
              color: 'bg-primary/10 text-primary',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-surface border border-border/50 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-primary/10 via-gold-soft/50 to-primary/5 dark:from-primary/20 dark:via-surface-2 dark:to-primary/10 rounded-2xl p-6 mb-8 border border-primary/10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gold-gradient rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold">Actions rapides</h2>
                <p className="text-sm text-muted-foreground">Créez et développez votre activité</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/services/new">
                <Button className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un service
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" className="rounded-xl">
                  <Search className="w-4 h-4 mr-2" />
                  Explorer
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Services Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Mes services</h2>
              {services && services.length > 0 && (
                <span className="text-sm text-muted-foreground">{services.length} service{services.length > 1 ? 's' : ''}</span>
              )}
            </div>

            {servicesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-surface border border-border/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : services?.length === 0 ? (
              <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Aucun service</p>
                <p className="text-sm text-muted-foreground mb-5">Créez votre premier service pour commencer</p>
                <Link href="/dashboard/services/new">
                  <Button className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer mon premier service
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {services?.map((service, index) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    onPublish={() => publishMutation.mutate(service.id)}
                    onPause={() => pauseMutation.mutate(service.id)}
                    onDelete={() => deleteMutation.mutate(service.id)}
                    isPublishing={publishMutation.isPending}
                    isPausing={pauseMutation.isPending}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* My Missions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Mes missions</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-5 w-fit">
              <button
                onClick={() => setTab('provider')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === 'provider'
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Prestataire
              </button>
              <button
                onClick={() => setTab('requester')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === 'requester'
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Demandeur
              </button>
            </div>

            {bookingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-surface border border-border/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : bookings?.length === 0 ? (
              <div className="bg-surface border border-border/50 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Aucune mission</p>
                <p className="text-sm text-muted-foreground mb-5">Explorez les services disponibles</p>
                <Link href="/search">
                  <Button variant="outline" className="rounded-xl">
                    <Search className="w-4 h-4 mr-2" />
                    Explorer
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {bookings?.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/services/${booking.serviceId}`}
                            className="font-semibold hover:text-primary transition-colors line-clamp-1 flex items-center gap-1"
                          >
                            {booking.service?.title}
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1.5">
                            {tab === 'provider' ? 'Demandeur: ' : 'Prestataire: '}
                            <span className="text-foreground">
                              {tab === 'provider'
                                ? booking.requester?.profile?.displayName || 'Anonyme'
                                : booking.provider?.profile?.displayName || 'Anonyme'}
                            </span>
                          </p>
                          {booking.agreedPriceCents && (
                            <p className="text-sm font-semibold text-primary mt-1.5">
                              {formatPrice(booking.agreedPriceCents)}
                            </p>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            statusColors[booking.status]
                          }`}
                        >
                          {statusIcons[booking.status]}
                          <span>{statusLabels[booking.status]}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                        {booking.status === 'PENDING' && tab === 'provider' && (
                          <>
                            <Button size="sm" className="rounded-xl h-9">
                              Accepter
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl h-9">
                              Refuser
                            </Button>
                          </>
                        )}
                        {booking.status === 'ACCEPTED' && (
                          <Button size="sm" className="rounded-xl h-9">
                            <Play className="w-4 h-4 mr-1.5" />
                            Démarrer
                          </Button>
                        )}
                        {booking.status === 'IN_PROGRESS' && (
                          <Button size="sm" className="rounded-xl h-9">
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Terminer
                          </Button>
                        )}
                        {booking.status === 'COMPLETED' && !booking.reviews?.length && (
                          <Button size="sm" variant="outline" className="rounded-xl h-9">
                            <Star className="w-4 h-4 mr-1.5" />
                            Laisser un avis
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Service Card Component
function ServiceCard({
  service,
  index,
  onPublish,
  onPause,
  onDelete,
  isPublishing,
  isPausing,
}: {
  service: Service;
  index: number;
  onPublish: () => void;
  onPause: () => void;
  onDelete: () => void;
  isPublishing: boolean;
  isPausing: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const statusConfig = {
    PUBLISHED: { label: 'Publié', class: 'bg-success-soft text-success' },
    PAUSED: { label: 'En pause', class: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
    DRAFT: { label: 'Brouillon', class: 'bg-muted text-muted-foreground' },
  };

  const status = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              service.kind === 'OFFER'
                ? 'bg-success-soft text-success'
                : 'bg-primary/10 text-primary'
            }`}>
              {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.class}`}>
              {status.label}
            </span>
          </div>
          <Link
            href={`/services/${service.id}`}
            className="font-semibold hover:text-primary transition-colors line-clamp-1"
          >
            {service.title}
          </Link>
          {service.category && (
            <p className="text-sm text-muted-foreground mt-1">{service.category.name}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg py-1 z-10 min-w-[160px]"
              >
                <Link
                  href={`/services/${service.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setShowActions(false)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Voir le service
                </Link>

                {service.status === 'DRAFT' && (
                  <button
                    onClick={() => { onPublish(); setShowActions(false); }}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-success"
                  >
                    <Eye className="w-4 h-4" />
                    Publier
                  </button>
                )}

                {service.status === 'PUBLISHED' && (
                  <button
                    onClick={() => { onPause(); setShowActions(false); }}
                    disabled={isPausing}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left"
                  >
                    <Pause className="w-4 h-4" />
                    Mettre en pause
                  </button>
                )}

                {service.status === 'PAUSED' && (
                  <button
                    onClick={() => { onPublish(); setShowActions(false); }}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-success"
                  >
                    <Eye className="w-4 h-4" />
                    Republier
                  </button>
                )}

                <div className="border-t border-border my-1" />

                <button
                  onClick={() => { setShowConfirmDelete(true); setShowActions(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Supprimer ce service ?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Cette action est irréversible. Le service sera définitivement supprimé.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={() => { onDelete(); setShowConfirmDelete(false); }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
