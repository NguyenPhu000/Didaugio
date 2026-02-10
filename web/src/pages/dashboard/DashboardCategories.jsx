import { Link } from "react-router-dom";
import Filter from "lucide-react/dist/esm/icons/filter";
import { ADMIN_ROUTES } from "@/constants/routes";

/**
 * DashboardCategories - Category list module in dashboard
 */
const DashboardCategories = ({ categories, places }) => {
  return (
    <div className="border border-black bg-white flex flex-col">
      <div className="p-4 border-b border-black border-dashed flex items-center justify-between">
        <h3 className="font-bold font-mono text-sm uppercase tracking-widest">
          DANH MỤC CƠ SỞ
        </h3>
        <Filter className="h-4 w-4 text-gray-400" />
      </div>
      <div className="p-0 flex-1 overflow-y-auto max-h-[300px] scrollbar-hide">
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-yellow-50 transition-colors group"
          >
            <span className="font-mono text-xs text-gray-400 w-8">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="font-bold text-sm uppercase flex-1">
              {cat.name}
            </span>
            <span className="font-mono text-xs bg-black text-white px-2 py-0.5 rounded-none group-hover:bg-primary group-hover:text-black transition-colors">
              {places.filter((p) => p.categoryId === cat.id).length}
            </span>
          </div>
        ))}
      </div>
      <Link
        to={ADMIN_ROUTES.CATEGORIES}
        className="p-4 border-t border-black bg-gray-50 text-center font-bold text-xs uppercase hover:bg-black hover:text-white transition-colors"
      >
        QUẢN LÝ DANH MỤC &rarr;
      </Link>
    </div>
  );
};

export default DashboardCategories;
