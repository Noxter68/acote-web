'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  Zap,
  MessageCircle,
  ArrowRight,
  Search,
  ChevronDown,
  MapPin,
  User,
  Building2,
  Navigation,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ServiceCard } from '@/components/services/service-card';
import { Service, Business } from '@/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Business card component for homepage
function HomeBusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/business/${business.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-surface border border-border rounded-2xl p-5 h-full hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{business.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              {business.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {business.city}
                </span>
              )}
              {business.owner?.reputation && business.owner.reputation.ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  {business.owner.reputation.ratingAvg5.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        {business.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {business.description}
          </p>
        )}
      </motion.div>
    </Link>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchType, setSearchType] = useState<'services' | 'businesses'>('services');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch latest offers (services with kind=OFFER)
  const { data: latestOffers } = useQuery({
    queryKey: ['latestOffers', userLocation],
    queryFn: () => api.searchServices({
      kind: 'OFFER',
      limit: 5,
      ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius: 50 }),
    }),
  });

  // Fetch latest requests (services with kind=REQUEST)
  const { data: latestRequests } = useQuery({
    queryKey: ['latestRequests', userLocation],
    queryFn: () => api.searchServices({
      kind: 'REQUEST',
      limit: 5,
      ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius: 50 }),
    }),
  });

  // Fetch latest businesses
  const { data: latestBusinesses } = useQuery({
    queryKey: ['latestBusinesses', userLocation],
    queryFn: () => api.searchBusinesses({
      limit: 5,
      ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng, radius: 50 }),
    }),
  });

  // Auto-request location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Location denied or error - continue without location
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFocused(false);
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query);
    }
    if (searchType === 'businesses') {
      params.set('type', 'businesses');
    }
    router.push(`/search?${params.toString()}`);
  };

  const trustFeatures = [
    {
      icon: Star,
      title: 'Notes sur 5',
      description: 'Évaluez chaque prestation avec précision',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      icon: TrendingUp,
      title: 'Système XP',
      description: 'Montez en niveau à chaque mission',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: CheckCircle,
      title: 'Avis vérifiés',
      description: 'Seuls les utilisateurs ayant terminé une mission peuvent noter',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      icon: Shield,
      title: 'Score de confiance',
      description: 'Un algorithme qui calcule la fiabilité',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden -mt-20 pt-20">
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ${
            isFocused ? 'scale-110 blur-sm' : 'scale-100'
          }`}
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2574&auto=format&fit=crop)',
          }}
        />
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            isFocused ? 'bg-black/80' : 'bg-black/50'
          }`}
        />

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
          >
            Services de confiance,
            <br />
            <span className="bg-linear-to-r from-white via-white/90 to-white/70 bg-clip-text">
              entre particuliers
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Offrez vos compétences ou trouvez l&apos;aide dont vous avez besoin.
            Un système de réputation transparent pour des échanges sereins.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative group" ref={searchContainerRef}>
              <div
                className={`absolute -inset-1 bg-linear-to-r from-white/20 via-white/10 to-white/20 rounded-full blur-lg transition-all duration-500 ${
                  isFocused ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="relative flex items-center">
                <Search className="absolute left-5 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  placeholder={searchType === 'businesses' ? "Rechercher un professionnel..." : "Que recherchez-vous ?"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  className={`w-full h-14 md:h-16 pl-14 pr-36 md:pr-44 text-lg rounded-full border-2 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 ${
                    isFocused
                      ? 'border-white shadow-2xl shadow-white/25'
                      : 'border-white/50 shadow-xl'
                  }`}
                />
                <button
                  type="submit"
                  className="absolute right-2 h-10 md:h-12 px-6 md:px-8 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary-hover transition-all duration-300 hover:shadow-lg flex items-center gap-2 z-10 cursor-pointer"
                >
                  Rechercher
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Search Type Toggle */}
              <div className="flex justify-center mt-4">
                <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setSearchType('services')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      searchType === 'services'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Particuliers
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType('businesses')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      searchType === 'businesses'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Professionnels
                  </button>
                </div>
              </div>
            </div>
          </motion.form>

          {/* Location indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center"
          >
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all cursor-pointer ${
                userLocation
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className={`w-4 h-4 ${userLocation ? 'text-green-400' : ''}`} />
              )}
              {userLocation ? 'Recherche autour de moi' : 'Activer la géolocalisation'}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="w-8 h-8 text-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* Latest Offers Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Dernières offres</h2>
              </div>
              <p className="text-muted-foreground">
                Découvrez les services proposés par la communauté
              </p>
            </div>
            <Link href="/search?kind=OFFER">
              <Button variant="outline" className="rounded-full hidden sm:flex">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {latestOffers?.data && latestOffers.data.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            >
              {latestOffers.data.slice(0, 5).map((service) => (
                <motion.div key={service.id} variants={fadeInUp}>
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-2xl">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune offre disponible pour le moment</p>
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link href="/search?kind=OFFER">
              <Button variant="outline" className="rounded-full">
                Voir toutes les offres
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Requests Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Dernières demandes</h2>
              </div>
              <p className="text-muted-foreground">
                Des personnes ont besoin de vos compétences
              </p>
            </div>
            <Link href="/search?kind=REQUEST">
              <Button variant="outline" className="rounded-full hidden sm:flex">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {latestRequests?.data && latestRequests.data.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            >
              {latestRequests.data.slice(0, 5).map((service) => (
                <motion.div key={service.id} variants={fadeInUp}>
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-surface rounded-2xl border border-border">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune demande disponible pour le moment</p>
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link href="/search?kind=REQUEST">
              <Button variant="outline" className="rounded-full">
                Voir toutes les demandes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Businesses Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Professionnels près de vous</h2>
              </div>
              <p className="text-muted-foreground">
                Des entreprises de confiance dans votre région
              </p>
            </div>
            <Link href="/search?type=businesses">
              <Button variant="outline" className="rounded-full hidden sm:flex">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {latestBusinesses?.data && latestBusinesses.data.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            >
              {latestBusinesses.data.slice(0, 5).map((business) => (
                <motion.div key={business.id} variants={fadeInUp}>
                  <HomeBusinessCard business={business} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-2xl">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun professionnel disponible pour le moment</p>
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link href="/search?type=businesses">
              <Button variant="outline" className="rounded-full">
                Voir tous les professionnels
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              La confiance au cœur
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Notre système de réputation garantit des échanges sereins
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {trustFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="bg-background rounded-2xl p-6 shadow-sm border border-border"
              >
                <div
                  className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Rejoignez des milliers d&apos;utilisateurs qui échangent déjà des services en toute confiance
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 bg-white text-primary hover:bg-white/90 border-white"
                  onClick={() => router.push('/auth/register')}
                >
                  Créer un compte gratuit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-8 text-white hover:bg-white/10"
                  onClick={() => router.push('/search')}
                >
                  Explorer les services
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
