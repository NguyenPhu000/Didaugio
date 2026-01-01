import { Link } from "react-router-dom";
import { Button } from "@/components/ui";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-muted">404</h1>
        <h2 className="text-2xl font-bold text-foreground mt-4">
          Khong tim thay trang
        </h2>
        <p className="text-muted-foreground mt-2">
          Trang ban dang tim khong ton tai hoac da bi xoa.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button>Quay ve trang chu</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
