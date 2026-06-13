import React from "react";
import Image from "next/image";
import Link from "next/link";
import { LuMenu } from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { removeUser } from "../../store/nextSlice";

const HeaderBottom=()=>{
    const { user, logout } = useAuth();
    const dispatch = useDispatch();

    const handleSignOut = async () => {
        try {
            await logout();
            dispatch(removeUser());
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return <div className="w-full h-10 bg-amazon_light text-sm text-white px-4 flex items-center">
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300"><LuMenu/>All</p>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Todays Deals</p>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Amazon miniTV</p>
        <Link href="/amazon-now" className="flex items-center h-8 px-2 cursor-pointer group">
            <div className="rounded-md overflow-hidden flex items-center ring-1 ring-transparent group-hover:ring-white duration-300 shadow-sm">
                <Image
                    src="/amazon-now.png"
                    alt="Amazon Now"
                    width={90}
                    height={24}
                    className="object-contain block"
                    priority
                />
            </div>
        </Link>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Mobiles</p>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Customer Service</p>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Electronics</p>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">New Releases</p>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Home & Kitchen</p>
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Fashion</p> 
        <p className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-white cursor-pointer duration-300">Amazon pay</p>
        {user && (
            <p 
                onClick={handleSignOut}
                className="flex items-center gap-1 h-8 px-2 border border-transparent hover:border-red-600 hover:text-red-500 text-amazon_yellow cursor-pointer duration-300"
            >
                Sign Out
            </p>
        )}
        </div>
    
        
}
export default HeaderBottom;