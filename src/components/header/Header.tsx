import React, { useEffect, useState } from "react"
import logo from "../../images/logo.png"
import Image from "next/image"
import cartIcon from "../../images/cart.png";
import { BiCaretDown } from "react-icons/bi";
import { HiOutlineSearch } from "react-icons/hi";
import { CiLocationOn } from "react-icons/ci";
import Link from "next/link";
import { useDispatch,useSelector } from "react-redux";
import { stateProps } from "@/type";
import { useAuth } from "../../hooks/useAuth";
import { addUser, setSearchTerm, filterProducts, removeUser } from "@/store/nextSlice";
import { useRouter } from "next/router";


const Header = () => {
    const dispatch=useDispatch();
    const router = useRouter();
    const [searchInput, setSearchInput] = useState('');
    const {productData,favoriteData} = useSelector(
        (state:stateProps)=>state.next);
    
    // Use Firebase Auth instead of NextAuth
    const { user, signInWithGoogle, logout } = useAuth();
        
        const handleSearch = () => {
            if (searchInput.trim()) {
                dispatch(setSearchTerm(searchInput));
                dispatch(filterProducts(searchInput));
                router.push(`/search?q=${encodeURIComponent(searchInput)}`);
            }
        };

        const handleKeyPress = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        };

        const handleSignIn = async () => {
            try {
                const user = await signInWithGoogle();
                if (user) {
                    dispatch(addUser({
                        name: user.displayName,
                        email: user.email,
                        image: user.photoURL,
                    }));
                }
            } catch (error) {
                console.error('Sign in error:', error);
                alert("Sign in failed. Please try again.");
            }
        };

        const handleSignOut = async () => {
            try {
                await logout();
                dispatch(removeUser());
            } catch (error) {
                console.error('Sign out error:', error);
            }
        };

        useEffect(() => {
           if (user) {
                dispatch(addUser({
                    name: user.displayName,
                    email: user.email,
                    image: user.photoURL,
                }));
            } else {
                dispatch(removeUser());
            }
        }, [user, dispatch]);
       




  return (
    <div className="w-full h-20 bg-amazon_blue  text-lightText sticky top-0 z-50">
     <div className="h-full w-full mx-auto inline-flex items-center justify-between gap-1 mdl:gap-3 px-4">
    {/*Logo*/}
       <Link href={"/"}className="px-2 border border-transparent hover:border-white cursor-pointer duration-300 items-center justify-center h-[70%]">
        <Image className="w-28 object-cover" src={logo} alt="logoImg"/>
        </Link>
    {/*delivery*/}
      <div className="px-2 border border-transparent hover:border-white cursor-pointer duration-300 items-center justify-center h-[70%]">
        <CiLocationOn/>
        <div className="text-xs">
          <p>Deliver to</p>
          <p className="text-white font-bold uppercase">India</p>
        </div>
      </div>
    {/*searchbar*/}
   <div className="flex-1 h-10 flex items-center justify-between relative">
      <input
        className="w-full h-full rounded-md px-2 placeholder:text-sm text-base text-black bg-white border border-transparent outline-none focus-visible:border-amazon_yellow"
        type="text"
        placeholder="Search amazon products"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <span 
        onClick={handleSearch}
        className="w-12 h-full bg-amazon_yellow text-black text-2xl flex
                items-center justify-center absolute right-0 rounded-md rounded-br-md cursor-pointer hover:bg-yellow-500 transition-colors">
        <HiOutlineSearch/>
      </span>
      </div>
      {/*signin*/}
      {/* Sign-in Section */}
      {user ? (
        <div className="px-2 border border-transparent hover:border-white cursor-pointer duration-300 items-center justify-center h-[70%] relative group">
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <Image 
                src={user.photoURL} 
                alt="User" 
                width={24} 
                height={24} 
                className="rounded-full"
              />
            )}
            <div className="text-xs">
              <p className="text-lightText">Hello, {user.displayName?.split(' ')[0]}</p>
              <p className="text-white font-bold flex items-center">Account & Lists{" "}
                <span><BiCaretDown/></span></p>
            </div>
          </div>
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 w-48 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 mt-1">
            <div className="p-4 border-b">
              <p className="text-sm font-semibold text-gray-800">{user.displayName}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleSignIn}
          className="px-2 border border-transparent hover:border-white cursor-pointer duration-300 items-center justify-center h-[70%]"
        >
          <p className="text-lightText">Hello, Sign In</p>
          <p className="text-white font-bold flex items-center">Account & Lists{" "}
            <span><BiCaretDown/></span></p>
        </div>
      )}

      {/*favourite*/}
      <div className="px-2 border border-transparent hover:border-white cursor-pointer duration-300 items-center justify-center h-[70%] relative">
        <p>Marked</p>
        <p className="text-white font-bold">&Favourites</p>
        {
          favoriteData.length > 0 && (
                        <span className="absolute -right-1 -top-1 w-6 h-6
                        bg-amazon_yellow border-2 border-amazon_blue rounded-full flex items-center justify-center text-xs
                        text-amazon_blue font-bold shadow-lg">{favoriteData.length}</span>
                    )

        }
        </div>
        {/*cart*/}
        <Link href={"/cart"} className="flex items-center px-2 border border-transparent hover:border-white cursor-pointer duration-300 items-center justify-center h-[70%] relative">
          <Image className="w-auto object-cover" src={cartIcon} alt="cartImg"/>
          <p className="text-ml text-white font-bold mt-3">Cart</p>
          {productData && productData.length > 0 && (
            <span className="absolute -right-1 -top-1 w-6 h-6
            bg-amazon_yellow border-2 border-amazon_blue rounded-full flex items-center justify-center text-xs
            text-amazon_blue font-bold shadow-lg animate-pulse">
              {productData.length}
            </span>
          )}
        </Link>





    </div>
</div>
    
  );
};

export default Header;
