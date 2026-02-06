'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/types';
import { formatPrice } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const isBoosted = service.boostedUntil && new Date(service.boostedUntil) > new Date();

  return (
    <Link href={`/service/${service.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2">{service.title}</CardTitle>
            <Badge variant={service.kind === 'OFFER' ? 'default' : 'secondary'}>
              {service.kind === 'OFFER' ? 'Offre' : 'Demande'}
            </Badge>
          </div>
          {isBoosted && (
            <Badge variant="outline" className="w-fit text-xs">
              Sponsorisé
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {service.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {service.tags?.slice(0, 3).map(({ tag }) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {service.createdBy?.profile?.avatarUrl ? (
                <img
                  src={service.createdBy.profile.avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted" />
              )}
              <span className="text-muted-foreground">
                {service.createdBy?.profile?.displayName || 'Anonyme'}
              </span>
              {service.createdBy?.reputation && (
                <span className="text-muted-foreground">
                  ★ {service.createdBy.reputation.ratingAvg5.toFixed(1)}
                </span>
              )}
            </div>

            {service.priceMinCents && (
              <span className="font-medium">
                {service.priceMaxCents
                  ? `${formatPrice(service.priceMinCents)} - ${formatPrice(service.priceMaxCents)}`
                  : `À partir de ${formatPrice(service.priceMinCents)}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {service.urgency === 'URGENT' && (
              <Badge variant="destructive" className="text-xs">Urgent</Badge>
            )}
            {service.isRecurring && (
              <span>Récurrent</span>
            )}
            {service.createdBy?.profile?.city && (
              <span>📍 {service.createdBy.profile.city}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
