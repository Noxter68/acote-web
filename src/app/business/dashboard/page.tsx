'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Building2,
  Users,
  Scissors,
  Calendar,
  Plus,
  Settings,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { formatPrice } from '@/lib/utils';
import { Business, Employee, BusinessService, Booking, BookingStatus } from '@/types';

export default function BusinessDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'employees' | 'bookings'>('overview');

  const { data: business, isLoading } = useQuery({
    queryKey: ['my-business'],
    queryFn: () => api.getMyBusiness(),
    enabled: !!user,
    refetchOnMount: 'always',
  });

  // Réservations reçues (en tant que provider)
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['business-bookings'],
    queryFn: () => api.getMyBookings('provider'),
    enabled: !!user,
  });

  // Filtrer uniquement les bookings business
  const businessBookings = bookings?.filter(b => b.businessServiceId) || [];
  const pendingBookings = businessBookings.filter(b => b.status === 'PENDING');

  const statusLabels: Record<BookingStatus, string> = {
    PENDING: 'En attente',
    ACCEPTED: 'Confirmé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELED: 'Annulé',
    DISPUTED: 'Litige',
  };

  const statusColors: Record<BookingStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    IN_PROGRESS: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    CANCELED: 'bg-stone-100 text-stone-600 dark:bg-stone-800/50 dark:text-stone-400',
    DISPUTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  const acceptBookingMutation = useMutation({
    mutationFn: (id: string) => api.acceptBooking(id),
    onSuccess: () => {
      success('Réservation confirmée');
      queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => showError('Erreur lors de la confirmation'),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => {
      success('Réservation annulée');
      queryClient.invalidateQueries({ queryKey: ['business-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: () => showError('Erreur lors de l\'annulation'),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => api.deleteBusinessService(id),
    onSuccess: () => {
      success('Service supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      success('Employé supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-business'] });
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <p className="text-muted-foreground">Vous devez être connecté.</p>
        <Link href="/auth/login">
          <Button className="mt-4">Se connecter</Button>
        </Link>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Créez votre business</h1>
          <p className="text-muted-foreground mb-6">
            Configurez votre établissement pour commencer à recevoir des réservations.
          </p>
          <Link href="/business/setup">
            <Button size="lg" className="rounded-full px-8">
              Commencer
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'employees', label: 'Équipe', icon: Users },
    { id: 'bookings', label: 'Réservations', icon: Calendar },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 pt-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {business.city || 'Aucune adresse'}
              {business.isVerified && (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200">
                  Vérifié
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${business.slug}`}>
            <Button variant="outline" className="rounded-full">
              Voir ma page
            </Button>
          </Link>
          <Link href="/business/settings">
            <Button variant="outline" className="rounded-full w-10 h-10 p-0">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="rounded-full whitespace-nowrap"
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{business.services?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Services</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{business.employees?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Employés</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{businessBookings.length}</div>
                <div className="text-sm text-muted-foreground">Réservations</div>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">0 €</div>
                <div className="text-sm text-muted-foreground">CA ce mois</div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Informations</h3>
                <div className="space-y-3">
                  {business.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">
                        {business.address}, {business.postalCode} {business.city}
                      </span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{business.phone}</span>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{business.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Abonnement</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        business.subscriptionTier === 'PREMIUM'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : business.subscriptionTier === 'PRO'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    >
                      {business.subscriptionTier}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {business.subscriptionTier === 'STARTER'
                        ? 'Passez à Pro pour plus de fonctionnalités'
                        : 'Toutes les fonctionnalités activées'}
                    </p>
                  </div>
                  {business.subscriptionTier === 'STARTER' && (
                    <Button size="sm" className="rounded-full">
                      Passer à Pro
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Services</h2>
              <Link href="/business/services/new">
                <Button className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un service
                </Button>
              </Link>
            </div>

            {business.services?.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Aucun service pour le moment</p>
                <Link href="/business/services/new">
                  <Button className="rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un service
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {business.services?.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onDelete={() => deleteServiceMutation.mutate(service.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'employees' && (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Équipe</h2>
              <Link href="/business/employees/new">
                <Button className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un employé
                </Button>
              </Link>
            </div>

            {business.employees?.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Aucun employé pour le moment</p>
                <Link href="/business/employees/new">
                  <Button className="rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un employé
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {business.employees?.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onDelete={() => deleteEmployeeMutation.mutate(employee.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Réservations</h2>
              {pendingBookings.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingBookings.length} en attente
                </Badge>
              )}
            </div>

            {bookingsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : businessBookings.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Aucune réservation pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businessBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-surface border border-border rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {booking.businessService?.name || 'Service'}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status]}`}>
                            {statusLabels[booking.status]}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium text-foreground">Client:</span>{' '}
                            {booking.requester?.profile?.displayName || 'Anonyme'}
                          </p>
                          {booking.employee && (
                            <p>
                              <span className="font-medium text-foreground">Avec:</span>{' '}
                              {booking.employee.firstName} {booking.employee.lastName}
                            </p>
                          )}
                          {booking.scheduledAt && (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                              {' à '}
                              {new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                          {booking.agreedPriceCents && (
                            <p className="font-semibold text-primary">
                              {formatPrice(booking.agreedPriceCents)}
                            </p>
                          )}
                        </div>
                      </div>

                      {booking.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => acceptBookingMutation.mutate(booking.id)}
                            disabled={acceptBookingMutation.isPending}
                          >
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => cancelBookingMutation.mutate(booking.id)}
                            disabled={cancelBookingMutation.isPending}
                          >
                            Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceCard({ service, onDelete }: { service: BusinessService; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium">{service.name}</h3>
          {!service.isActive && (
            <Badge variant="outline" className="text-xs">Inactif</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{formatPrice(service.priceCents)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {service.durationMinutes} min
          </span>
          {service.category && <span>{service.category.name}</span>}
        </div>
      </div>
      <div className="relative">
        <Button
          variant="ghost"
          className="rounded-full h-8 w-8 p-0"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-lg py-1 z-10">
            <Link
              href={`/business/services/${service.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </Link>
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmployeeCard({ employee, onDelete }: { employee: Employee; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            {employee.avatarUrl ? (
              <img src={employee.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-medium text-primary">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium">{employee.firstName} {employee.lastName}</h3>
            {employee.role && (
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-lg py-1 z-10">
              <Link
                href={`/business/employees/${employee.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors w-full"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
      {employee.services && employee.services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {employee.services.slice(0, 3).map(({ businessService }) => (
            <Badge key={businessService.id} variant="outline" className="text-xs">
              {businessService.name}
            </Badge>
          ))}
          {employee.services.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{employee.services.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
