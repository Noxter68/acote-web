'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Clock, Gift, Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { ServiceKind, Urgency, Recurrence, Category, WeekDay } from '@/types';
import Link from 'next/link';

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  kind: ServiceKind | null;
  categoryId: string | null;
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  urgency: Urgency;
  isRecurring: boolean;
  recurrence: Recurrence;
  deadlineAt: string | null;
  // Duration & Availability
  durationMinutes: number | null;
  availableDays: WeekDay[];
  availableFromTime: string | null;
  availableToTime: string | null;
  availableFromDate: string | null;
  availableToDate: string | null;
}

const steps = [
  { number: 1, title: 'Type', description: 'Offre ou demande' },
  { number: 2, title: 'Catégorie', description: 'Choisir une catégorie' },
  { number: 3, title: 'Détails', description: 'Titre et description' },
  { number: 4, title: 'Tarifs', description: 'Prix et options' },
  { number: 5, title: 'Disponibilités', description: 'Durée et horaires' },
];

const WEEK_DAYS: { value: WeekDay; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Lundi', short: 'Lun' },
  { value: 'TUESDAY', label: 'Mardi', short: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mercredi', short: 'Mer' },
  { value: 'THURSDAY', label: 'Jeudi', short: 'Jeu' },
  { value: 'FRIDAY', label: 'Vendredi', short: 'Ven' },
  { value: 'SATURDAY', label: 'Samedi', short: 'Sam' },
  { value: 'SUNDAY', label: 'Dimanche', short: 'Dim' },
];

export default function NewServicePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    kind: null,
    categoryId: null,
    title: '',
    description: '',
    city: '',
    latitude: null,
    longitude: null,
    priceMinCents: null,
    priceMaxCents: null,
    urgency: 'FLEXIBLE',
    isRecurring: false,
    recurrence: 'ONE_TIME',
    deadlineAt: null,
    durationMinutes: null,
    availableDays: [],
    availableFromTime: null,
    availableToTime: null,
    availableFromDate: null,
    availableToDate: null,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FormData>) => api.createService({
      ...data,
      city: data.city || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      priceMinCents: data.priceMinCents || undefined,
      priceMaxCents: data.priceMaxCents || undefined,
      deadlineAt: data.deadlineAt || undefined,
      durationMinutes: data.durationMinutes || undefined,
      availableDays: data.availableDays?.length ? data.availableDays : undefined,
      availableFromTime: data.availableFromTime || undefined,
      availableToTime: data.availableToTime || undefined,
      availableFromDate: data.availableFromDate || undefined,
      availableToDate: data.availableToDate || undefined,
    } as never),
    onSuccess: (service) => {
      success('Service créé avec succès !');
      router.push(`/service/${service.id}`);
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Erreur lors de la création');
    },
  });

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.kind !== null;
      case 2:
        return formData.categoryId !== null;
      case 3:
        return formData.title.trim().length >= 5 && formData.description.trim().length >= 20;
      case 4:
        return formData.kind === 'OFFER' || (formData.priceMinCents && formData.priceMinCents > 0);
      case 5:
        return true; // Disponibilités optionnelles
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < 5 && canProceed()) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  };

  const handleSubmit = () => {
    if (!canProceed()) return;
    createMutation.mutate(formData as Partial<FormData>);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <PageLoader text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Connectez-vous</h1>
        <p className="text-muted-foreground mb-4">
          Vous devez être connecté pour créer un service.
        </p>
        <Link href="/auth/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Créer un service</h1>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px]">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step >= s.number ? 'var(--primary)' : 'var(--muted)',
                    color: step >= s.number ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-sm"
                >
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </motion.div>
                <span className="text-xs mt-2 text-center hidden sm:block">
                  <span className="font-medium">{s.title}</span>
                </span>
              </div>
              {index < steps.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step > s.number ? 'var(--primary)' : 'var(--border)',
                  }}
                  className="h-0.5 w-8 sm:w-16 mx-1"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <StepType kind={formData.kind} onChange={(kind) => updateForm({ kind })} />
              )}
              {step === 2 && (
                <StepCategory
                  categories={categories || []}
                  loading={categoriesLoading}
                  selectedId={formData.categoryId}
                  onChange={(categoryId) => updateForm({ categoryId })}
                />
              )}
              {step === 3 && (
                <StepDetails
                  title={formData.title}
                  description={formData.description}
                  city={formData.city}
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={(updates) => updateForm(updates)}
                />
              )}
              {step === 4 && (
                <StepPricing
                  formData={formData}
                  onChange={(updates) => updateForm(updates)}
                />
              )}
              {step === 5 && (
                <StepAvailability
                  formData={formData}
                  onChange={(updates) => updateForm(updates)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </Button>

        {step < 5 ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || createMutation.isPending}
            isLoading={createMutation.isPending}
          >
            Créer le service
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Type Selection
function StepType({
  kind,
  onChange,
}: {
  kind: ServiceKind | null;
  onChange: (kind: ServiceKind) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Quel type de service ?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('OFFER')}
          className={`p-6 rounded-xl border-2 text-left transition-colors cursor-pointer ${
            kind === 'OFFER'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            kind === 'OFFER' ? 'bg-primary/20' : 'bg-muted'
          }`}>
            <Gift className={`w-6 h-6 ${kind === 'OFFER' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <h3 className="font-semibold mb-1">Je propose un service</h3>
          <p className="text-sm text-muted-foreground">
            Vous avez une compétence ou du temps à offrir
          </p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange('REQUEST')}
          className={`p-6 rounded-xl border-2 text-left transition-colors cursor-pointer ${
            kind === 'REQUEST'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
            kind === 'REQUEST' ? 'bg-primary/20' : 'bg-muted'
          }`}>
            <Search className={`w-6 h-6 ${kind === 'REQUEST' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <h3 className="font-semibold mb-1">Je cherche un service</h3>
          <p className="text-sm text-muted-foreground">
            Vous avez besoin d&apos;aide pour quelque chose
          </p>
        </motion.button>
      </div>
    </div>
  );
}

// Step 2: Category Selection
function StepCategory({
  categories,
  loading,
  selectedId,
  onChange,
}: {
  categories: Category[];
  loading: boolean;
  selectedId: string | null;
  onChange: (id: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (loading) {
    return <PageLoader text="Chargement des catégories..." />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Choisissez une catégorie</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {categories.map((category) => (
          <div key={category.id}>
            <motion.button
              onClick={() => {
                if (category.children?.length) {
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  );
                } else {
                  onChange(category.id);
                }
              }}
              className={`w-full p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                selectedId === category.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{category.name}</span>
                {category.children?.length ? (
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      expandedCategory === category.id ? 'rotate-90' : ''
                    }`}
                  />
                ) : null}
              </div>
            </motion.button>

            <AnimatePresence>
              {expandedCategory === category.id && category.children?.length && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-4 mt-2 space-y-2"
                >
                  {category.children.map((child) => (
                    <motion.button
                      key={child.id}
                      whileHover={{ x: 4 }}
                      onClick={() => onChange(child.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedId === child.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {child.name}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 3: Title & Description & Location
function StepDetails({
  title,
  description,
  city,
  latitude,
  longitude,
  onChange,
}: {
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (updates: { title?: string; description?: string; city?: string; latitude?: number | null; longitude?: number | null }) => void;
}) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        onChange({ latitude: lat, longitude: lng });

        // Try to reverse geocode to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
          );
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || '';
          if (cityName) {
            onChange({ latitude: lat, longitude: lng, city: cityName });
          }
        } catch {
          // Ignore reverse geocoding errors
        }

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Vous avez refusé la géolocalisation');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Position non disponible');
            break;
          case error.TIMEOUT:
            setLocationError('Délai d\'attente dépassé');
            break;
          default:
            setLocationError('Erreur de géolocalisation');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const clearLocation = () => {
    onChange({ latitude: null, longitude: null, city: '' });
    setLocationError(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Décrivez votre service</h2>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Titre <span className="text-muted-foreground">({title.length}/100)</span>
        </label>
        <Input
          value={title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex: Cours de guitare pour débutants"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Minimum 5 caractères
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Description <span className="text-muted-foreground">({description.length}/2000)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Décrivez votre service en détail : ce que vous proposez, votre expérience, les conditions..."
          maxLength={2000}
          rows={6}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Minimum 20 caractères
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          <MapPin className="w-4 h-4 inline mr-1" />
          Localisation
        </label>

        <div className="space-y-3">
          {/* City input */}
          <div className="relative">
            <Input
              value={city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Votre ville"
              className="pr-24"
            />
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                latitude && longitude
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {locationLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              {latitude && longitude ? 'Localisé' : 'Me localiser'}
            </button>
          </div>

          {/* Location status */}
          {latitude && longitude && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{city || 'Position détectée'}</p>
                  <p className="text-xs text-muted-foreground">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearLocation}
                className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              >
                Effacer
              </button>
            </motion.div>
          )}

          {locationError && (
            <p className="text-xs text-destructive">{locationError}</p>
          )}

          <p className="text-xs text-muted-foreground">
            La localisation permet aux utilisateurs de trouver votre service plus facilement
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 4: Pricing & Options
function StepPricing({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const urgencyOptions: { value: Urgency; label: string }[] = [
    { value: 'FLEXIBLE', label: 'Flexible' },
    { value: 'SOON', label: 'Bientôt' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Tarifs et options</h2>

      {/* Price */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Prix de la prestation {formData.kind === 'REQUEST' && <span className="text-destructive">*</span>}
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="number"
              value={formData.priceMinCents ? formData.priceMinCents / 100 : ''}
              onChange={(e) => onChange({ priceMinCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
              placeholder="Prix min"
              min={0}
            />
          </div>
          <span className="text-muted-foreground">à</span>
          <div className="flex-1">
            <Input
              type="number"
              value={formData.priceMaxCents ? formData.priceMaxCents / 100 : ''}
              onChange={(e) => onChange({ priceMaxCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
              placeholder="Prix max"
              min={0}
            />
          </div>
          <span className="text-muted-foreground font-medium">€</span>
        </div>
        {formData.kind === 'REQUEST' && (
          <p className="text-xs text-muted-foreground mt-1">
            Un budget minimum est requis pour les demandes
          </p>
        )}
      </div>

      {/* Urgency */}
      <div>
        <label className="text-sm font-medium mb-3 block">Urgence</label>
        <div className="flex flex-wrap gap-2">
          {urgencyOptions.map((option) => (
            <motion.button
              key={option.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange({ urgency: option.value })}
              className={`px-4 py-2 rounded-full border text-sm transition-colors cursor-pointer ${
                formData.urgency === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recurring */}
      <div>
        <label className="text-sm font-medium mb-3 block">Service récurrent ?</label>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ isRecurring: false, recurrence: 'ONE_TIME' })}
            className={`px-4 py-2 rounded-full border text-sm transition-colors cursor-pointer ${
              !formData.isRecurring
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Ponctuel
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ isRecurring: true })}
            className={`px-4 py-2 rounded-full border text-sm transition-colors cursor-pointer ${
              formData.isRecurring
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Récurrent
          </motion.button>
        </div>

        <AnimatePresence>
          {formData.isRecurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {(['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as Recurrence[]).map((rec) => (
                <motion.button
                  key={rec}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onChange({ recurrence: rec })}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors cursor-pointer ${
                    formData.recurrence === rec
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {rec === 'WEEKLY' && 'Hebdomadaire'}
                  {rec === 'BIWEEKLY' && 'Bi-hebdomadaire'}
                  {rec === 'MONTHLY' && 'Mensuel'}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step 5: Duration & Availability
function StepAvailability({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours'>('hours');

  const durationValue = formData.durationMinutes
    ? (durationUnit === 'hours' ? formData.durationMinutes / 60 : formData.durationMinutes)
    : '';

  const handleDurationChange = (value: string) => {
    if (!value) {
      onChange({ durationMinutes: null });
      return;
    }
    const numValue = parseFloat(value);
    const minutes = durationUnit === 'hours' ? Math.round(numValue * 60) : Math.round(numValue);
    onChange({ durationMinutes: minutes });
  };

  const toggleDay = (day: WeekDay) => {
    const currentDays = formData.availableDays;
    if (currentDays.includes(day)) {
      onChange({ availableDays: currentDays.filter((d) => d !== day) });
    } else {
      onChange({ availableDays: [...currentDays, day] });
    }
  };

  const selectAllWeekdays = () => {
    onChange({ availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] });
  };

  const selectWeekend = () => {
    onChange({ availableDays: ['SATURDAY', 'SUNDAY'] });
  };

  const selectAllDays = () => {
    onChange({ availableDays: WEEK_DAYS.map((d) => d.value) });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Durée et disponibilités</h2>

      {/* Duration */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          <Clock className="w-4 h-4 inline mr-1" />
          Durée de la prestation
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-32">
            <Input
              type="number"
              value={durationValue}
              onChange={(e) => handleDurationChange(e.target.value)}
              placeholder="Durée"
              min={0}
              step={durationUnit === 'hours' ? 0.5 : 1}
            />
          </div>
          <div className="flex gap-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (durationUnit !== 'minutes' && formData.durationMinutes) {
                  // Conversion already stored in minutes
                }
                setDurationUnit('minutes');
              }}
              className={`px-3 py-2 rounded-l-full border text-sm transition-colors cursor-pointer ${
                durationUnit === 'minutes'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Minutes
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setDurationUnit('hours')}
              className={`px-3 py-2 rounded-r-full border-y border-r text-sm transition-colors cursor-pointer ${
                durationUnit === 'hours'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              Heures
            </motion.button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Laissez vide si la durée est variable
        </p>
      </div>

      {/* Available Days */}
      <div>
        <label className="text-sm font-medium mb-3 block">Jours de disponibilité</label>

        {/* Quick selections */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={selectAllWeekdays}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Semaine
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            onClick={selectWeekend}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Week-end
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            onClick={selectAllDays}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Tous les jours
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            onClick={() => onChange({ availableDays: [] })}
            className="text-xs text-muted-foreground hover:underline cursor-pointer"
          >
            Effacer
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => (
            <motion.button
              key={day.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleDay(day.value)}
              className={`w-12 h-12 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                formData.availableDays.includes(day.value)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {day.short}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div>
        <label className="text-sm font-medium mb-2 block">Plage horaire</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="time"
              value={formData.availableFromTime || ''}
              onChange={(e) => onChange({ availableFromTime: e.target.value || null })}
            />
            <span className="text-xs text-muted-foreground">À partir de</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex-1">
            <Input
              type="time"
              value={formData.availableToTime || ''}
              onChange={(e) => onChange({ availableToTime: e.target.value || null })}
            />
            <span className="text-xs text-muted-foreground">Jusqu&apos;à</span>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="text-sm font-medium mb-2 block">Période de disponibilité</label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="date"
              value={formData.availableFromDate || ''}
              onChange={(e) => onChange({ availableFromDate: e.target.value || null })}
              min={new Date().toISOString().split('T')[0]}
            />
            <span className="text-xs text-muted-foreground">Du</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex-1">
            <Input
              type="date"
              value={formData.availableToDate || ''}
              onChange={(e) => onChange({ availableToDate: e.target.value || null })}
              min={formData.availableFromDate || new Date().toISOString().split('T')[0]}
            />
            <span className="text-xs text-muted-foreground">Au</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Laissez vide si pas de limite de dates
        </p>
      </div>
    </div>
  );
}
