'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  CheckCircle,
  Calendar,
  ChevronRight,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import { Business, BusinessService, Employee } from '@/types';

export default function BusinessPublicPage() {
  const { slug } = useParams();
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'service' | 'employee' | 'time' | 'confirm'>('service');

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api.getBusinessBySlug(slug as string),
    enabled: !!slug,
  });

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', selectedEmployee?.id, selectedService?.id, selectedDate],
    queryFn: () =>
      api.getAvailableSlots(
        selectedEmployee!.id,
        selectedService!.id,
        selectedDate
      ),
    enabled: !!selectedEmployee && !!selectedService && !!selectedDate,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-16 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Business non trouvé</h1>
        <p className="text-muted-foreground">Ce business n'existe pas ou a été supprimé.</p>
      </div>
    );
  }

  const getEmployeesForService = (serviceId: string) => {
    return business.employees?.filter((emp) =>
      emp.services?.some((s) => s.businessService.id === serviceId)
    ) || [];
  };

  // Generate dates for the next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return "Aujourd'hui";
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Demain';

    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-background -mt-20 pt-20">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-primary to-primary-hover">
        {business.coverUrl && (
          <img
            src={business.coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="relative -mt-16 sm:-mt-20 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-surface border-4 border-background rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {business.name[0]}
                </span>
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-8">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold">{business.name}</h1>
                {business.isVerified && (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {business.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {business.city}
                  </span>
                )}
                {business.owner?.reputation && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {(business.owner.reputation.ratingAvg10 / 10).toFixed(1)}
                    <span className="text-muted-foreground">
                      ({business.owner.reputation.ratingCount} avis)
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {business.description && (
            <p className="mt-4 text-muted-foreground max-w-2xl">
              {business.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 mt-4">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="w-4 h-4" />
                {business.phone}
              </a>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                {business.email}
              </a>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
                Site web
              </a>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 pb-12">
          {/* Services List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Nos prestations</h2>

            {business.services?.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                <p className="text-muted-foreground">Aucune prestation disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {business.services?.map((service) => (
                  <motion.button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setBookingStep('employee');
                    }}
                    className={`w-full text-left bg-surface border rounded-2xl p-5 transition-all hover:border-primary/50 cursor-pointer ${
                      selectedService?.id === service.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border'
                    }`}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold text-primary">
                            {formatPrice(service.priceCents)}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {service.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Team Section */}
            {business.employees && business.employees.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Notre équipe</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {business.employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4"
                    >
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        {employee.avatarUrl ? (
                          <img
                            src={employee.avatarUrl}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium text-primary">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        {employee.role && (
                          <p className="text-sm text-muted-foreground">{employee.role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Réserver
                </h3>

                <AnimatePresence mode="wait">
                  {bookingStep === 'service' && (
                    <motion.div
                      key="service"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-sm text-muted-foreground">
                        Sélectionnez une prestation pour commencer
                      </p>
                    </motion.div>
                  )}

                  {bookingStep === 'employee' && selectedService && (
                    <motion.div
                      key="employee"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">{selectedService.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(selectedService.priceCents)} • {selectedService.durationMinutes} min
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        Avec qui souhaitez-vous prendre rendez-vous ?
                      </p>

                      <div className="space-y-2">
                        {getEmployeesForService(selectedService.id).map((employee) => (
                          <button
                            key={employee.id}
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setBookingStep('time');
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                          >
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              {employee.avatarUrl ? (
                                <img
                                  src={employee.avatarUrl}
                                  alt=""
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                {employee.firstName} {employee.lastName}
                              </p>
                              {employee.role && (
                                <p className="text-xs text-muted-foreground">{employee.role}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSelectedService(null);
                          setBookingStep('service');
                        }}
                      >
                        Changer de prestation
                      </Button>
                    </motion.div>
                  )}

                  {bookingStep === 'time' && selectedService && selectedEmployee && (
                    <motion.div
                      key="time"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">{selectedService.name}</p>
                        <p className="text-xs text-muted-foreground">
                          avec {selectedEmployee.firstName} • {formatPrice(selectedService.priceCents)}
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        Choisissez une date
                      </p>

                      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                        {dates.map((date) => (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                              selectedDate === date
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {formatDateLabel(date)}
                          </button>
                        ))}
                      </div>

                      {selectedDate && (
                        <>
                          <p className="text-sm text-muted-foreground mb-3">
                            Créneaux disponibles
                          </p>

                          {slotsLoading ? (
                            <p className="text-sm text-muted-foreground">Chargement...</p>
                          ) : slotsData?.slots.filter((s) => s.available).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Aucun créneau disponible ce jour
                            </p>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {slotsData?.slots
                                .filter((s) => s.available)
                                .map((slot) => (
                                  <Button
                                    key={slot.time}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      // Handle booking
                                      setBookingStep('confirm');
                                    }}
                                  >
                                    {slot.time}
                                  </Button>
                                ))}
                            </div>
                          )}
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSelectedEmployee(null);
                          setSelectedDate('');
                          setBookingStep('employee');
                        }}
                      >
                        Changer d'intervenant
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Address Card */}
              {business.address && (
                <div className="bg-surface border border-border rounded-2xl p-6 mt-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Adresse
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {business.address}
                    <br />
                    {business.postalCode} {business.city}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
