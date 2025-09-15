// src/components/index.ts
export * from './ui/accordion';
export * from './ui/alert-dialog';
export * from './ui/alert';
export * from './ui/avatar';
export * from './ui/badge';
export * from './ui/button';
export * from './ui/calendar';
export * from './ui/card';
export * from './ui/carousel';
export * from './ui/chart';
export * from './ui/checkbox';
export * from './ui/collapsible';
export * from './ui/dialog';
export * from './ui/dropdown-menu';
export * from './ui/form';
export * from './ui/input';
export * from './ui/label';
export * from './ui/menubar';
export * from './ui/popover';
export * from './ui/progress';
export * from './ui/radio-group';
export * from './ui/scroll-area';
export * from './ui/select';
export * from './ui/separator';
export * from './ui/sheet';
export * from './ui/sidebar';
export * from './ui/skeleton';
export * from './ui/slider';
export * from './ui/switch';
export * from './ui/table';
export * from './ui/tabs';
export * from './ui/textarea';
export * from './ui/toast';
export * from './ui/toaster';
export * from './ui/tooltip';

// Composants personnalisés
export { default as Header } from './header';
export { default as Footer } from './footer';
export { Hero } from './hero'; // CORRIGÉ
export { Testimonials } from './testimonials'; // CORRIGÉ
export { CatchPhrase } from './catch-phrase'; // CORRIGÉ
export { default as PropertyCard } from './property-card';
export { SimilarProperties } from './similar-properties';
export { ImageGallery } from './image-gallery';
export { default as LocationInput } from './location-input';
export { AgentContactForm } from './agent-contact-form';
export { default as ActionSelect } from './action-select';
export { PropertyTypeSelect } from './property-type-select';
export { Icons } from './icons';

// Composants du dashboard client
export { FavoritesList } from './FavoritesList';
export { SavedSearchesList } from './SavedSearchesList';
export { VisitsHistoryList } from './VisitsHistoryList';
export { DocumentsList } from './DocumentsList';
export { PaymentsList } from './PaymentsList';
export { PaymentView } from './PaymentView';
export { ComparisonBar } from './ComparisonBar';
export { ComparisonDialog } from './ComparisonDialog';
export { ClientUpcomingVisitsWidget } from './ClientUpcomingVisitsWidget';
export { RecentFavoritesWidget } from './RecentFavoritesWidget';
export { default as SavedSearchesWidget } from './SavedSearchesWidget';
export { RecommendedProperties } from './RecommendedProperties';
export { PandaDocSigningModal } from './PandaDocSigningModal';

// Composants du dashboard agent
export { AgentLeadList } from './AgentLeadList';
export { default as AgentPropertyList } from './AgentPropertyList';
export { AgentUpcomingVisitsWidget } from './AgentUpcomingVisitsWidget';
export { AgentVisitList } from './AgentVisitList';
export { default as RecentActivityWidget } from './RecentActivityWidget';

// Composants de recherche
export { default as SearchFilters } from './SearchFilters';
export type { FiltersState } from './SearchFilters';
export { default as PropertyListItem } from './PropertyListItem';
export { default as SearchResultsMap } from './SearchResultsMap';


// Composants partagés
export { Map } from './Map';
export { NotificationBell } from './NotificationBell';
export { NotificationsList } from './NotificationsList';
export { UserList } from './UserList';
export { ShareButtons } from './ShareButtons';
export { VirtualTour } from './VirtualTour';
export { VisitRequestForm } from './VisitRequestForm';
export { propertySchema, default as PropertyForm } from './PropertyForm';
export { PropertyTypeManager } from './PropertyTypeManager';
export { ProfileForm } from './ProfileForm';
export { ClientOnlyWrapper } from './ClientOnlyWrapper';
