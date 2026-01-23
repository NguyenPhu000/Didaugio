import { useState, useEffect, useRef, useMemo } from "react";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import CanThoMap from "@/components/map/CanThoMap";
import {
  Card,
  CardContent,
  // CardHeader, CardFooter via map component or removed here
  Button,
  Input,
  Badge,
  Skeleton,
  ScrollArea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  // Avatar, AvatarFallback, AvatarImage
} from "@/components/ui";
import {
  Search,
  MapPin,
  Star,
  // X,
  Filter,
  ChevronDown,
  Eye,
  MapIcon,
  ListIcon,
  Heart,
  // Share2
} from "lucide-react";
import { Link } from "react-router-dom";
import { PRICE_RANGE_LABELS } from "@/constants/constants";
import { CAN_THO_CENTER, DEFAULT_MAP_STYLE } from "@/constants/mapConfigs";

const MapPage = () => {
  const { places, fetchPlaces, loading } = usePlaceStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [viewState, setViewState] = useState({
    latitude: CAN_THO_CENTER.lat,
    longitude: CAN_THO_CENTER.lng,
    zoom: 11,
  });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("approved");
  const [viewMode, setViewMode] = useState("map"); // "map" or "list"
  const [sortBy, setSortBy] = useState("name");
  const mapRef = useRef(null);

  useEffect(() => {
    fetchPlaces({
      limit: 100,
      status: selectedStatus === "all" ? "" : selectedStatus,
    });
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [fetchPlaces, fetchCategories, selectedStatus, categories.length]);

  const filteredPlaces = useMemo(() => {
    let filtered = places;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (p) => p.categoryId?.toString() === selectedCategory
      );
    }

    // Sort places
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "views":
          return (b.viewCount || 0) - (a.viewCount || 0);
        case "featured":
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [places, searchQuery, selectedCategory, sortBy]);

  const handleMarkerClick = (place, e) => {
    e.originalEvent.stopPropagation();
    setSelectedPlace(place);
    setViewState({
      ...viewState,
      latitude: place.latitude || CAN_THO_CENTER.lat,
      longitude: place.longitude || CAN_THO_CENTER.lng,
      zoom: 15,
      transitionDuration: 500,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-sidebar-background rounded-xl overflow-hidden">
      {/* Header with Filters */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bản đồ địa điểm
            </h1>
            <p className="text-muted-foreground">
              Khám phá {filteredPlaces.length} địa điểm tuyệt vời tại Cần Thơ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={setViewMode} className="">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapIcon className="h-4 w-4" />
                  Bản đồ
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <ListIcon className="h-4 w-4" />
                  Danh sách
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Heart className="h-4 w-4 mr-2" />
              Lưu tìm kiếm
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
            <Input
              placeholder="Tìm kiếm địa điểm, khu vực..."
              className="pl-9 border-input focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-emerald-200 hover:bg-emerald-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Danh mục
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCategory("all")}>
                Tất cả danh mục
              </DropdownMenuItem>
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                >
                  {cat.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-input hover:bg-accent"
              >
                Trạng thái
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedStatus("all")}>
                Tất cả
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("approved")}>
                Đã duyệt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("pending")}>
                Chờ duyệt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-emerald-200 hover:bg-emerald-50"
              >
                Sắp xếp:{" "}
                {sortBy === "name"
                  ? "Tên"
                  : sortBy === "rating"
                  ? "Đánh giá"
                  : sortBy === "views"
                  ? "Lượt xem"
                  : "Nổi bật"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Theo tên
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("rating")}>
                Đánh giá cao
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("views")}>
                Lượt xem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("featured")}>
                Nổi bật
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar List */}
        <div
          className={`${
            viewMode === "list" ? "w-full" : "w-[450px]"
          } flex flex-col bg-white/60 backdrop-blur-sm border-r border-border`}
        >
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Card
                      key={i}
                      className="overflow-hidden border-emerald-100"
                    >
                      <div className="flex">
                        <Skeleton className="h-32 w-32 shrink-0" />
                        <div className="p-4 space-y-3 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </Card>
                  ))
                : filteredPlaces.map((place) => (
                    <Card
                      key={place.id}
                      className={`group overflow-hidden cursor-pointer transition-all duration-200 border-border/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 ${
                        selectedPlace?.id === place.id
                          ? "ring-2 ring-primary border-primary shadow-lg"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedPlace(place);
                        if (place.latitude && place.longitude) {
                          setViewState((prev) => ({
                            ...prev,
                            latitude: place.latitude,
                            longitude: place.longitude,
                            zoom: 15,
                            transitionDuration: 800,
                          }));
                        }
                      }}
                    >
                      <div className="flex">
                        <div className="relative h-32 w-32 shrink-0 overflow-hidden bg-emerald-50">
                          {place.images?.[0]?.url ? (
                            <>
                              <img
                                src={place.images[0].url}
                                alt={place.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </>
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <MapPin className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          {place.isFeatured && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-sm">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Nổi bật
                              </Badge>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-4 flex-1">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {place.name}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-emerald-700/80">
                              <Badge
                                variant="outline"
                                className="text-xs border-primary/20 text-primary"
                              >
                                {place.category?.name || "Địa điểm"}
                              </Badge>
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">
                                {place.district?.name}
                              </span>
                            </div>

                            {place.shortDescription && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {place.shortDescription}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3 text-xs text-primary">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {place.viewCount || 0}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {place.averageRating?.toFixed(1) || "N/A"}
                                </div>
                              </div>

                              {place.priceRange && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-primary/10 text-primary"
                                >
                                  {PRICE_RANGE_LABELS[place.priceRange]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
            </div>
          </ScrollArea>
        </div>

        {/* Map Area */}
        {viewMode === "map" && (
          <div className="flex-1 relative">
            <CanThoMap 
              places={filteredPlaces} 
              onSelectPlace={(place) => {
                 setSelectedPlace(place);
                 setViewState(prev => ({ ...prev, zoom: 15, latitude: place.latitude, longitude: place.longitude }));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
