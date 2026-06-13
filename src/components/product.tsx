import React, { useState } from "react";
import { ProductProps } from "@/type";
import Image from "next/image";
import { HiShoppingCart } from "react-icons/hi";
import { FaHeart } from "react-icons/fa";
import FormattedPrice from "./FormattedPrice";
import PlaceholderImage from "./PlaceholderImage";
import { useDispatch } from "react-redux";
import { addToCart, addToFavorite } from "@/store/nextSlice";

interface Props {
    productData: ProductProps[];
}

const Products = ({productData} : Props) =>{
    const dispatch = useDispatch();
    
    if (!productData || productData.length === 0) {
        return (
            <div className="w-full px-6 py-10 text-center">
                <p className="text-gray-500 text-lg">No products available at the moment. Please try again later.</p>
            </div>
        );
    }
    
    // Component for handling image with fallback
    const ProductImage = ({ src, alt, title }: { src: string; alt: string; title: string }) => {
        const [hasError, setHasError] = useState(false);
        
        const handleError = () => {
            setHasError(true);
        };
        
        if (hasError) {
            return (
                <PlaceholderImage 
                    title={title}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover scale-90 hover:scale-100 transition-transform duration-300"
                />
            );
        }
        
        return (
            <Image 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                width={400} 
                height={400} 
                src={src} 
                alt={alt}
                onError={handleError}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Vo5YkRVmiLsDdLTdLiCn0HJjA/wBKGaGDFhQAfcUiGOGu0r/qiE+hGdF4ZKBKxHB2Kcp0kkdVYVZpkyqgdJAfcUiGOGu0r/qiE+hGdF4ZKBKxHB2Kcp0kkdVYVZpkyqgdJAfcUiGOGu0r/qiE+hGdF4ZKBKxHB2Kcp0kkdVYVZpkyqgdJ"
            />
        );
    };
    
    return(
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* All products in consistent 4-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productData.map(({id,
                title,
                price,
                description,
                category,
                image}:ProductProps) =>(
                        <div key={id} className="bg-white text-black border border-gray-200
                        rounded-lg group overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300
                        transform hover:-translate-y-1">
                            <div className="w-full h-[320px] relative bg-white p-4">
                            <ProductImage src={image} alt="productImg" title={title} />
                            <div className="w-12 h-12 absolute bottom-4 right-4 border-[1px] 
                            border-gray-300 bg-white rounded-md flex flex-col translate-x-20 group-hover:translate-x-0
                            transition-transform duration-300 shadow-lg">
                                <span onClick={() => dispatch(
                                    addToCart({
                                        id : id,
                                        title:title,
                                        price:price,
                                        description:description,
                                        category:category,
                                        image:image,
                                        quantity:1,
                                })
                            )} className="w-full h-full border-b-[1px] border-b-gray-300 flex items-center justify-center 
                                text-lg bg-transparent hover:bg-amazon_yellow cursor-pointer duration-300
                                "><HiShoppingCart/></span>
                                <span onClick={() => dispatch(
                                    addToFavorite({
                                        id : id,
                                        title:title,
                                        price:price,
                                        description:description,
                                        category:category,
                                        image:image,
                                        quantity:1,
                                }) 
                            )}className="w-full h-full flex items-center justify-center 
                                text-lg bg-transparent hover:bg-amazon_yellow cursor-pointer duration-300
                                "><FaHeart/></span>
                            </div>
                            </div>
                            <div className="px-4 pb-4">
                                <p className="text-xs text-gray-500 tracking-wide uppercase mb-1">{category}</p>
                                <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{title}</p>
                                <p className="flex items-center mb-2">
                                    <span className="text-amazon_blue font-bold text-lg">
                                        <FormattedPrice amount={price*10}/>
                                    </span>
                                </p>
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                    {description.substring(0,120)}...
                                </p>
                                <button onClick={() => dispatch(
                                    addToCart({
                                        id : id,
                                        title:title,
                                        price:price,
                                        description:description,
                                        category:category,
                                        image:image,
                                        quantity:1,
                                })
                            )} className="w-full h-9 text-sm font-medium bg-amazon_blue text-white rounded-md hover:bg-amazon_yellow 
                                hover:text-black duration-300">Add to cart</button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>

    );
};

export default Products;