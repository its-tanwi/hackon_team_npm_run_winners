
import Banner from "@/components/Banner";
import Products from "@/components/product";
import { ProductProps } from "@/type";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAllProducts } from "@/store/nextSlice";

interface Props{
  productData: ProductProps[]
}


export default function Home({productData} : Props) {
  const dispatch = useDispatch();
  
  // Populate allProducts store for search functionality
  useEffect(() => {
    if (productData && productData.length > 0) {
      dispatch(setAllProducts(productData.map(product => ({ ...product, quantity: 1 }))));
    }
  }, [productData, dispatch]);
  
  console.log(productData)
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="relative">
        <Banner/>
        {/* Products container with much more negative margin to overlap banner significantly */}
        <div className="relative -mt-64 z-30">
          <Products productData={productData}/>
        </div>
      </div>
    </main>
  );
}
export const getServerSideProps=async()=>{
  // Use mock data with working images for now
  // You can uncomment the API calls later when network issues are resolved
  
  /*
  try {
    // Try the original fakestoreapi.com first (it has working images)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch("https://fakestoreapi.com/products", {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const productData = await res.json();
    
    // Check if we received an array of products
    if (Array.isArray(productData) && productData.length > 0) {
      return {props: {productData}}
    } else {
      throw new Error('Invalid API response or no products found');
    }
  } catch (error) {
    console.error("Failed to fetch from APIs:", error);
  }
  */
  
  // Use mock data with working images from a reliable CDN
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
      productData: mockProducts
    }
  }
}