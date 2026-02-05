'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { formatPrice, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Shield,
  MessageCircle,
  Share2,
  Heart,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Pause,
  Play
} from 'lucide-react';

export default function ServicePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => api.getService(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader text="Chargement du service..." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Service introuvable</h1>
          <p className="text-muted-foreground mb-6">Ce service n'existe plus ou a été supprimé.</p>
          <Link href="/search">
            <Button>Retour à la recherche</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isBoosted = service.boostedUntil && new Date(service.boostedUntil) > new Date();
  const isOwner = user?.id === service.createdByUserId;

  // Fake Unsplash images based on service kind
  const bannerImages = [
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&h=600&fit=crop',
  ];
  const bannerImage = bannerImages[parseInt(id) % bannerImages.length] || bannerImages[0];

  const avatarImages = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  ];
  const avatarImage = service.createdBy?.profile?.avatarUrl || avatarImages[parseInt(id) % avatarImages.length];

  const urgencyConfig = {
    URGENT: { label: 'Urgent', color: 'destructive', icon: AlertCircle },
    SOON: { label: 'Bientôt', color: 'default', icon: Clock },
    FLEXIBLE: { label: 'Flexible', color: 'secondary', icon: Calendar },
  };

  const recurrenceLabels: Record<string, string> = {
    WEEKLY: 'Hebdomadaire',
    BIWEEKLY: 'Bi-hebdomadaire',
    MONTHLY: 'Mensuel',
    ONCE: 'Ponctuel',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[320px] md:h-[400px] -mt-20"
      >
        <div className="absolute inset-0">
          <img
            src={bannerImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        {/* Breadcrumb */}
        <div className="relative z-10 pt-28 px-4">
          <div className="max-w-6xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-white/80">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/search" className="hover:text-white transition-colors">Services</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{service.kind === 'OFFER' ? 'Offre' : 'Demande'}</span>
            </nav>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Title Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-6 md:p-8">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge
                    variant={service.kind === 'OFFER' ? 'default' : 'secondary'}
                    className="text-sm px-3 py-1"
                  >
                    {service.kind === 'OFFER' ? '✨ Offre de service' : '🔍 Recherche'}
                  </Badge>
                  {isBoosted && (
                    <Badge variant="outline" className="bg-gold-soft text-primary border-primary/20">
                      ⭐ Sponsorisé
                    </Badge>
                  )}
                  {service.urgency === 'URGENT' && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      🔥 Urgent
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  {service.title}
                </h1>

                {/* Tags */}
                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {service.tags.map(({ tag }) => (
                      <Link key={tag.id} href={`/search?tag=${tag.name}`}>
                        <Badge
                          variant="outline"
                          className="bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
                        >
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Price */}
                {service.priceMinCents && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-soft mb-6">
                    <span className="text-2xl font-bold text-primary">
                      {service.priceMaxCents
                        ? `${formatPrice(service.priceMinCents)} - ${formatPrice(service.priceMaxCents)}`
                        : formatPrice(service.priceMinCents)}
                    </span>
                    {service.isRecurring && (
                      <span className="text-sm text-muted-foreground">
                        / {recurrenceLabels[service.recurrence || 'ONCE']?.toLowerCase()}
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Détails du service
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Urgency */}
                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Urgence
                    </div>
                    <p className="font-medium">
                      {urgencyConfig[service.urgency as keyof typeof urgencyConfig]?.label || 'Flexible'}
                    </p>
                  </div>

                  {/* Recurrence */}
                  {service.isRecurring && (
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <RefreshCw className="w-4 h-4" />
                        Récurrence
                      </div>
                      <p className="font-medium">
                        {recurrenceLabels[service.recurrence || 'ONCE']}
                      </p>
                    </div>
                  )}

                  {/* Deadline */}
                  {service.deadlineAt && (
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        Deadline
                      </div>
                      <p className="font-medium">{formatDate(service.deadlineAt)}</p>
                    </div>
                  )}

                  {/* Published */}
                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Publié le
                    </div>
                    <p className="font-medium">{formatDate(service.createdAt)}</p>
                  </div>

                  {/* Expires */}
                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Expire le
                    </div>
                    <p className="font-medium">{formatDate(service.expiresAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Author Card */}
            <Card className="overflow-hidden sticky top-24">
              <CardContent className="p-0">
                {/* Author Header */}
                <div className="p-6 bg-gradient-to-br from-gold-soft to-muted">
                  <Link href={`/profile/${service.createdByUserId}`} className="block">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={avatarImage}
                          alt=""
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {service.createdBy?.profile?.displayName || 'Utilisateur'}
                        </p>
                        {service.createdBy?.profile?.city && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {service.createdBy.profile.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Stats */}
                {service.createdBy?.reputation && (
                  <div className="px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-gold-dark fill-gold-dark" />
                        <span className="font-bold text-lg">
                          {(service.createdBy.reputation.ratingAvg10 / 10).toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({service.createdBy.reputation.ratingCount} avis)
                        </span>
                      </div>
                      <Badge variant="secondary" className="bg-gold-soft text-primary">
                        Niveau {service.createdBy.reputation.level}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <Shield className="w-3 h-3 text-success" />
                      Identité vérifiée
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      <MessageCircle className="w-3 h-3 text-primary" />
                      Répond rapidement
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                  {!isOwner ? (
                    <>
                      {user ? (
                        <>
                          <Button className="w-full" size="lg">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {service.kind === 'OFFER' ? 'Demander ce service' : 'Proposer mes services'}
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1">
                              <Heart className="w-4 h-4 mr-2" />
                              Sauvegarder
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <Share2 className="w-4 h-4 mr-2" />
                              Partager
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-4">
                            Connectez-vous pour contacter ce prestataire
                          </p>
                          <Link href="/auth/login" className="block">
                            <Button className="w-full" size="lg">
                              Se connecter
                            </Button>
                          </Link>
                          <p className="text-xs text-muted-foreground mt-3">
                            Pas encore inscrit ?{' '}
                            <Link href="/auth/register" className="text-primary hover:underline">
                              Créer un compte
                            </Link>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Link href={`/dashboard/services/${service.id}/edit`} className="block">
                        <Button variant="outline" className="w-full">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Modifier l'annonce
                        </Button>
                      </Link>
                      {service.status === 'PUBLISHED' ? (
                        <Button variant="outline" className="w-full">
                          <Pause className="w-4 h-4 mr-2" />
                          Mettre en pause
                        </Button>
                      ) : (
                        <Button className="w-full">
                          <Play className="w-4 h-4 mr-2" />
                          Publier
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <Share2 className="w-4 h-4 mr-2" />
                          Partager
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Safety Notice */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Transaction sécurisée</p>
                    <p className="text-xs text-muted-foreground">
                      Tous les paiements sont protégés. Ne payez jamais en dehors de la plateforme.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
