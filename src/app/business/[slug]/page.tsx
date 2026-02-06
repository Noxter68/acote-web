'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
  Quote,
  MessageCircle,
  Edit3,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import { BusinessService, Review, Booking } from '@/types';
import { ReviewFormModal } from '@/components/reviews/review-form-modal';

// Star rating component
function StarRating({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

// Review card component
function ReviewCard({ review }: { review: Review }) {
  const authorName = review.author?.profile?.displayName || 'Client';
  const serviceName = review.booking?.businessService?.name;
  const employeeName = review.booking?.employee
    ? `${review.booking.employee.firstName} ${review.booking.employee.lastName}`
    : null;

  return (
    <div className="border-b border-border/50 last:border-0 pb-4 last:pb-0 mb-4 last:mb-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
          {review.author?.profile?.avatarUrl ? (
            <img
              src={review.author.profile.avatarUrl}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-sm">{authorName}</span>
            <StarRating score={review.score} />
          </div>
          {serviceName && (
            <p className="text-xs text-muted-foreground mb-2">
              {serviceName}
              {employeeName && ` • avec ${employeeName}`}
            </p>
          )}
          {review.comment && (
            <p className="text-sm text-foreground/90 leading-relaxed">{review.comment}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          {/* Business reply */}
          {review.reply && (
            <div className="mt-3 pl-3 border-l-2 border-primary/30 bg-muted/30 rounded-r-lg py-2 pr-3">
              <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Réponse du propriétaire
              </p>
              <p className="text-sm text-foreground/80">{review.reply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessPublicPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api.getBusinessBySlug(slug as string),
    enabled: !!slug,
  });

  const { data: reviews } = useQuery({
    queryKey: ['business-reviews', business?.id],
    queryFn: () => api.getBusinessReviews(business!.id),
    enabled: !!business?.id,
  });

  // Get user's completed bookings with this business (to check if they can leave a review)
  const { data: myBookings } = useQuery({
    queryKey: ['my-bookings-for-review', business?.id],
    queryFn: () => api.getMyBookings('requester'),
    enabled: !!user && !!business?.id,
  });

  // Find a completed booking without a review for this business
  const completedBookingWithoutReview = myBookings?.find(
    (booking) =>
      booking.businessServiceId &&
      booking.businessService?.business?.id === business?.id &&
      booking.status === 'COMPLETED' &&
      !booking.reviews?.some((r) => r.type === 'REVIEW_PROVIDER')
  );

  // Check if user is the business owner (can't review own business)
  const isOwnBusiness = user?.id === business?.ownerId;

  const handleServiceSelect = (service: BusinessService) => {
    router.push(`/business/${slug}/book/${service.id}`);
  };

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

  const avgRating = business.owner?.reputation?.ratingAvg5
    ? business.owner.reputation.ratingAvg5.toFixed(1)
    : null;
  const reviewCount = business.owner?.reputation?.ratingCount || 0;

  return (
    <div className="min-h-screen bg-background -mt-20 pt-20 pb-24 lg:pb-12">
      {/* Cover Image */}
      <div className="relative h-40 sm:h-56 md:h-64 bg-linear-to-r from-primary to-primary-hover">
        {business.coverUrl && (
          <img
            src={business.coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="relative -mt-12 sm:-mt-16 md:-mt-20 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-surface border-4 border-background rounded-2xl shadow-lg flex items-center justify-center overflow-hidden shrink-0">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {business.name[0]}
                </span>
              )}
            </div>

            {/* Business Info */}
            <div className="flex-1 pt-1 sm:pt-6 md:pt-8">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{business.name}</h1>
                {business.isVerified && (
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                {business.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{business.city}</span>
                  </span>
                )}
                {avgRating && reviews && reviews.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    <span className="font-medium text-foreground">{avgRating}</span>
                    <span className="text-muted-foreground">
                      ({reviews.length} avis)
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
              {business.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-2 rounded-lg"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">{business.phone}</span>
                <span className="sm:hidden">Appeler</span>
              </a>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-2 rounded-lg"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">{business.email}</span>
                <span className="sm:hidden">Email</span>
              </a>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-3 py-2 rounded-lg"
              >
                <Globe className="w-4 h-4" />
                Site web
              </a>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Services List */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Services */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold mb-4">Nos prestations</h2>

              {business.services?.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground">Aucune prestation disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {business.services?.map((service) => (
                    <motion.button
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="w-full text-left bg-surface border border-border rounded-2xl p-4 sm:p-5 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-[0.99]"
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base sm:text-lg mb-1 truncate pr-2">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                            <span className="font-semibold text-primary text-base">
                              {formatPrice(service.priceCents)}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {service.durationMinutes} min
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>

            {/* Team Section */}
            {business.employees && business.employees.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold mb-4">Notre équipe</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {business.employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        {employee.avatarUrl ? (
                          <img
                            src={employee.avatarUrl}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-base sm:text-lg font-medium text-primary">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        {employee.role && (
                          <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section - Mobile */}
            <section className="lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Avis clients</h2>
                {avgRating && reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-lg">{avgRating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({reviews.length})</span>
                  </div>
                )}
              </div>

              {/* Leave review button - Mobile */}
              {completedBookingWithoutReview && !isOwnBusiness && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl mb-4"
                  onClick={() => setReviewBooking(completedBookingWithoutReview)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Écrire un avis
                </Button>
              )}

              {!reviews || reviews.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                  <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
                  {reviews.slice(0, 5).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {reviews.length > 5 && (
                    <button className="w-full text-center text-sm text-primary font-medium mt-4 hover:underline">
                      Voir tous les avis ({reviews.length})
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Address - Mobile only */}
            {business.address && (
              <section className="lg:hidden">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Adresse</h2>
                <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {business.address}
                      <br />
                      {business.postalCode} {business.city}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Quick Book Card */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Réserver
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez une prestation pour réserver un créneau
                </p>
                {business.services && business.services.length > 0 && (
                  <Button
                    className="w-full rounded-full"
                    onClick={() => handleServiceSelect(business.services![0])}
                  >
                    Réserver maintenant
                  </Button>
                )}
              </div>

              {/* Reviews Card - Desktop */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Avis
                  </h3>
                  {avgRating && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-lg">{avgRating}</span>
                      <span className="text-sm text-muted-foreground">/ 5</span>
                    </div>
                  )}
                </div>

                {avgRating && (
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i <= Math.round(parseFloat(avgRating))
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {reviews?.length || 0} avis
                    </span>
                  </div>
                )}

                {/* Leave review button - Desktop */}
                {completedBookingWithoutReview && !isOwnBusiness && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl mb-4"
                    onClick={() => setReviewBooking(completedBookingWithoutReview)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Écrire un avis
                  </Button>
                )}

                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-4">
                    <Quote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun avis</p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto pr-2 -mr-2">
                    {reviews.slice(0, 5).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}

                {reviews && reviews.length > 5 && (
                  <button className="w-full text-center text-sm text-primary font-medium mt-4 pt-4 border-t border-border hover:underline">
                    Voir tous les avis ({reviews.length})
                  </button>
                )}
              </div>

              {/* Address Card - Desktop */}
              {business.address && (
                <div className="bg-surface border border-border rounded-2xl p-6">
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

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface/95 backdrop-blur-lg border-t border-border p-4 z-40">
        <Button
          className="w-full rounded-full shadow-lg"
          size="lg"
          onClick={() => {
            if (business.services && business.services.length > 0) {
              handleServiceSelect(business.services[0]);
            }
          }}
          disabled={!business.services || business.services.length === 0}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Réserver maintenant
        </Button>
      </div>

      {/* Review Form Modal */}
      {reviewBooking && (
        <ReviewFormModal
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          reviewType="REVIEW_PROVIDER"
        />
      )}
    </div>
  );
}
