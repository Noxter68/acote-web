'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Star, Shield, TrendingUp, Award, Quote } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, getXpProgress } from '@/lib/utils';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => api.getProfile(id),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.getUserReviews(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background -mt-20 pt-20">
        <div className="h-48 bg-gradient-to-br from-primary/20 via-gold-soft to-primary/10" />
        <div className="container mx-auto px-4 -mt-20">
          <div className="animate-pulse">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-40 h-40 rounded-2xl bg-surface border-4 border-background shadow-xl" />
              <div className="flex-1 pt-4 space-y-3">
                <div className="h-8 w-64 bg-muted rounded-xl" />
                <div className="h-5 w-40 bg-muted rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">?</span>
          </div>
          <h1 className="text-2xl font-bold">Utilisateur introuvable</h1>
          <p className="text-muted-foreground mt-2">Ce profil n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  const xpProgress = user.reputation
    ? getXpProgress(user.reputation.xp, user.reputation.level)
    : 0;

  const stats = [
    {
      label: 'Note moyenne',
      value: user.reputation?.ratingAvg5 ? user.reputation.ratingAvg5.toFixed(1) : '-',
      suffix: '/5',
      icon: Star,
      color: 'text-primary',
    },
    {
      label: 'Niveau',
      value: user.reputation?.level || 1,
      suffix: '',
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      label: 'Confiance',
      value: user.reputation ? Math.round(user.reputation.trustScore) : '-',
      suffix: '%',
      icon: Shield,
      color: 'text-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background -mt-20 pt-20">
      {/* Hero Header */}
      <div className="h-48 md:h-56 bg-gradient-to-br from-primary/20 via-gold-soft to-primary/10 dark:from-primary/10 dark:via-surface-2 dark:to-primary/5" />

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="-mt-20 md:-mt-24"
        >
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Avatar */}
            <div className="relative">
              {user.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt=""
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-background shadow-xl bg-surface"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background shadow-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    {(user.profile?.displayName || user.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              {user.subscriptionStatus === 'PRO' && (
                <div className="absolute -bottom-2 -right-2 bg-gold-gradient text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  PRO
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 md:pt-6">
              <h1 className="text-2xl md:text-3xl font-black">
                {user.profile?.displayName || 'Utilisateur'}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                {user.profile?.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{user.profile.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis {formatDate(user.createdAt)}</span>
                </div>
              </div>

              {user.profile?.bio && (
                <p className="mt-4 text-foreground/80 max-w-xl leading-relaxed">
                  {user.profile.bio}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mt-8"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-surface rounded-2xl p-4 md:p-6 border border-border/50 text-center"
            >
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl md:text-3xl font-black">
                {stat.value}
                <span className="text-base md:text-lg font-medium text-muted-foreground">
                  {stat.suffix}
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* XP Progress */}
        {user.reputation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 bg-surface rounded-2xl p-4 md:p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Progression niveau {user.reputation.level}</span>
              <span className="text-sm text-muted-foreground">{user.reputation.xp} XP</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gold-gradient rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 pb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">
              Avis reçus
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({reviews?.length || 0})
              </span>
            </h2>
          </div>

          {reviews?.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border/50 p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucun avis pour le moment.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les avis apparaîtront ici après les premières missions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews?.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="bg-surface rounded-2xl border border-border/50 p-5 md:p-6"
                >
                  <div className="flex items-start gap-4">
                    {review.author?.profile?.avatarUrl ? (
                      <img
                        src={review.author.profile.avatarUrl}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="font-bold text-primary">
                          {(review.author?.profile?.displayName || 'A')?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold truncate">
                          {review.author?.profile?.displayName || 'Anonyme'}
                        </p>
                        <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                          <span className="font-bold text-primary">{review.score}/5</span>
                        </div>
                      </div>

                      {review.comment && (
                        <div className="mt-3 relative">
                          <Quote className="absolute -left-1 -top-1 w-4 h-4 text-muted-foreground/30" />
                          <p className="text-foreground/80 pl-4 leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-3">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
