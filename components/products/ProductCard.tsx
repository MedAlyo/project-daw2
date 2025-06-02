import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/firebase/firestoreActions'; // Assuming Product type is defined here

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Default image if product.images is empty or undefined
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.png'; // This should now work

  return (
    <Link href={`/products/${product.id}`} className="block border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out overflow-hidden">
      <div className="relative w-full h-48 bg-gray-200">
        <Image 
          src={imageUrl} 
          alt={product.name}
          layout="fill"
          objectFit="cover"
          className="group-hover:opacity-75 transition-opacity duration-200 ease-in-out"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate" title={product.name}>
          {product.name}
        </h3>
        {/* TODO: Add shop name if available in Product data or fetch separately */}
        {/* <p className="text-sm text-gray-600 truncate">{product.shopName || 'Shop Name'}</p> */}
        <p className="text-xl font-bold text-gray-900 mt-1">
          ${product.price.toFixed(2)}
        </p>
        {product.stockQuantity !== undefined && product.stockQuantity <= 0 && ( // This should now work
          <p className="text-sm text-red-600 mt-1">Out of Stock</p>
        )}
        {/* TODO: Add a button to add to cart or view details if needed */}
      </div>
    </Link>
  );
};

export default ProductCard;