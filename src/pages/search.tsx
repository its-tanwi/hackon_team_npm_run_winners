import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { GetServerSideProps } from 'next';
import { ProductProps, stateProps } from '@/type';
import { setAllProducts, setSearchTerm, filterProducts } from '@/store/nextSlice';
import Products from '@/components/product';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi';

interface SearchPageProps {
  allProducts: ProductProps[];
  searchQuery: string;
}

const SearchPage = ({ allProducts, searchQuery }: SearchPageProps) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { filteredProducts } = useSelector((state: stateProps) => state.next);

  useEffect(() => {
    // Set all products in store
    dispatch(setAllProducts(allProducts.map(product => ({ ...product, quantity: 1 }))));
    
    // Set search term and filter
    if (searchQuery) {
      dispatch(setSearchTerm(searchQuery));
      dispatch(filterProducts(searchQuery));
    }
  }, [dispatch, allProducts, searchQuery]);

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-amazon_blue hover:text-amazon_yellow transition-colors mb-4"
          >
            <HiArrowLeft className="text-xl" />
            <span>Back to Home</span>
          </button>
          
          <div className="border-b border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Search Results
            </h1>
            {searchQuery && (
              <p className="text-gray-600">
                {filteredProducts.length > 0 
                  ? `${filteredProducts.length} results for "${searchQuery}"`
                  : `No results found for "${searchQuery}"`
                }
              </p>
            )}
          </div>
        </div>

        {/* Search Results */}
        {filteredProducts.length > 0 ? (
          <Products productData={filteredProducts} />
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No products found
              </h2>
              <p className="text-gray-600 mb-6">
                We couldn&apos;t find any products matching your search. Try different keywords or browse our categories.
              </p>
              <Link 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-amazon_blue text-white rounded-md hover:bg-amazon_yellow hover:text-black transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { q } = context.query;
  const searchQuery = typeof q === 'string' ? q : '';

  // Use the same mock products from the main page
  const mockProducts: ProductProps[] = [
    {
      id: 1,
      title: "Fjallraven - Foldsack No. 1 Backpack",
      price: 109.95,
      description: "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday",
      category: "men's clothing",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center",
      brand: "Fjallraven"
    },
    {
      id: 2,
      title: "Mens Casual Premium Slim Fit T-Shirts",
      price: 22.3,
      description: "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing.",
      category: "men's clothing",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
      brand: "Premium"
    },
    {
      id: 3,
      title: "Mens Cotton Jacket",
      price: 55.99,
      description: "Great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling.",
      category: "men's clothing",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&crop=center",
      brand: "Cotton Co"
    },
    {
      id: 4,
      title: "Mens Casual Slim Fit",
      price: 15.99,
      description: "The color could be slightly different between on the screen and in practice. Please note that body builds vary by person.",
      category: "men's clothing",
      image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=400&fit=crop&crop=center",
      brand: "Casual Wear"
    },
    {
      id: 5,
      title: "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet",
      price: 695,
      description: "From our Legends Collection, the Naga was inspired by the mythical water dragon that protects the ocean's pearl.",
      category: "jewelery",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center",
      brand: "John Hardy"
    },
    {
      id: 6,
      title: "Solid Gold Petite Micropave",
      price: 168,
      description: "Satisfaction Guaranteed. Return or exchange any order within 30 days. Designed and sold by Hafeez Center in the United States.",
      category: "jewelery",
      image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop&crop=center",
      brand: "Hafeez Center"
    },
    {
      id: 7,
      title: "White Gold Plated Princess",
      price: 9.99,
      description: "Classic Created Wedding Engagement Solitaire Diamond Promise Ring for Her. Gifts to spoil your love more for Engagement, Wedding, Anniversary, Valentine's Day...",
      category: "jewelery",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=center",
      brand: "Princess Collection"
    },
    {
      id: 8,
      title: "Pierced Owl Rose Gold Plated Stainless Steel Double",
      price: 10.99,
      description: "Rose Gold Plated Double Flared Tunnel Plug Earrings. Made of 316L Stainless Steel",
      category: "jewelery",
      image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop&crop=center",
      brand: "Pierced Owl"
    },
    {
      id: 9,
      title: "WD 2TB Elements Portable External Hard Drive - USB 3.0",
      price: 64,
      description: "USB 3.0 and USB 2.0 Compatibility Fast data transfers Improve PC Performance High Capacity; Compatibility Formatted NTFS for Windows 10, Windows 8.1, Windows 7",
      category: "electronics",
      image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop&crop=center",
      brand: "Western Digital"
    },
    {
      id: 10,
      title: "SanDisk SSD PLUS 1TB Internal SSD - SATA III 6 Gb/s",
      price: 109,
      description: "Easy upgrade for faster boot up, shutdown, application load and response. Boosts burst write performance, making it ideal for typical PC workloads.",
      category: "electronics",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&crop=center",
      brand: "SanDisk"
    },
    {
      id: 11,
      title: "Silicon Power 256GB SSD 3D NAND A55 SLC Cache Performance Boost SATA III 2.5",
      price: 109,
      description: "3D NAND flash are applied to deliver high transfer speeds. Remarkable transfer speeds that enable faster bootup and improved overall system performance.",
      category: "electronics",
      image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop&crop=center",
      brand: "Silicon Power"
    },
    {
      id: 12,
      title: "WD 4TB Gaming Drive Works with Playstation 4 Portable External Hard Drive",
      price: 114,
      description: "Expand your PS4 gaming experience, Play anywhere Fast and easy, setup Sleek design with high capacity, 3-year manufacturer limited warranty",
      category: "electronics",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=400&fit=crop&crop=center",
      brand: "Western Digital"
    }
  ];

  return {
    props: {
      allProducts: mockProducts,
      searchQuery,
    },
  };
};

export default SearchPage;
