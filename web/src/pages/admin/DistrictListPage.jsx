import { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Grid,
  List,
  Layers,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import * as districtService from "@/apis/districtService";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
} from "@/components/ui";

/**
 * DISTRICT LIST PAGE - T.I.M STYLE
 */
const DistrictListPage = () => {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const res = await districtService.getAllDistricts();
        setDistricts(res.data || []);
      } catch (error) {
        console.error("Failed to fetch districts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, []);

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen p-8 bg-[#F4F4F4] relative font-sans">
      <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-16 bg-primary"></div>
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-foreground font-technical">
                QUẢN LÝ KHU VỰC
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-black text-white px-1 font-mono uppercase">
                  GEODATA // DISTRICTS
                </span>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                  HÀNH CHÍNH & RANH GIỚI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-black p-4 flex justify-between shadow-sm">
          <div className="flex shadow-sm w-96">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white">
              <Search className="h-4 w-4" />
            </div>
            <input
              placeholder="TÌM KIẾM QUẬN/HUYỆN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-10 px-4 border-y border-r border-black font-mono text-sm uppercase focus:outline-none focus:bg-yellow-50"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-10 w-10 rounded-none border border-black ${viewMode === "grid" ? "bg-primary text-black" : "hover:bg-gray-100"}`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-10 w-10 rounded-none border border-black ${viewMode === "list" ? "bg-primary text-black" : "hover:bg-gray-100"}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin"></div>
            <div className="mt-4 font-mono text-xs uppercase tracking-widest">
              LOADING GEO DATA...
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-2"
            }
          >
            {filteredDistricts.map((d, index) =>
              viewMode === "grid" ? (
                <div
                  key={d.id}
                  className="group relative bg-white border border-black p-6 hover:shadow-hard transition-all duration-300"
                >
                  {/* Decor */}
                  <div className="absolute top-0 right-0 p-2 opacity-50 text-[10px] font-mono text-gray-400">
                    #{String(d.id).padStart(3, "0")}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center border border-gray-200 group-hover:bg-black group-hover:text-white transition-colors">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <Badge className="rounded-none bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none uppercase text-[10px]">
                      ACTIVE
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold uppercase mb-1">{d.name}</h3>
                  <p className="text-xs font-mono text-gray-500 mb-4 uppercase">
                    CẦN THƠ CITY
                  </p>

                  <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-500">PHƯỜNG/XÃ</span>
                    <span className="font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {d.wards?.length || "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  key={d.id}
                  className="flex items-center justify-between bg-white border border-gray-200 p-4 hover:border-black transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center font-bold font-mono text-xs">
                      {String(d.id).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="font-bold text-sm uppercase">
                        {d.name}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400">
                        ADMINISTRATIVE UNIT
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 font-mono uppercase">
                        WARDS
                      </div>
                      <div className="font-bold">{d.wards?.length || "—"}</div>
                    </div>
                    <Button size="icon" variant="ghost">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictListPage;
