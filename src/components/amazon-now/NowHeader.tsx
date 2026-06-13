import React from "react";
import Image from "next/image";
import { HiOutlineUser, HiOutlineSearch, HiX } from "react-icons/hi";
import { LuZap } from "react-icons/lu";
import { useAuth } from "../../hooks/useAuth";

interface Props {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

const getFirstName = (fullName: string | null | undefined, email: string | null | undefined) => {
    if (fullName && fullName.trim()) return fullName.trim().split(" ")[0];
    if (email) return email.split("@")[0];
    return "Guest";
};

const NowHeader = ({ searchTerm, onSearchChange }: Props) => {
    const { user } = useAuth();
    const firstName = getFirstName(user?.displayName, user?.email);
    const photoURL = user?.photoURL;

    return (
        <div className="bg-[#0F1B2D] text-white px-4 sm:px-6 lg:px-8 pt-4 pb-6 rounded-b-2xl shadow-md">
            <div className="flex flex-col gap-4 mdl:flex-row mdl:items-center mdl:justify-between">
                <div className="flex items-center justify-between mdl:justify-start mdl:gap-6">
                    <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition overflow-hidden">
                        {photoURL ? (
                            <Image
                                src={photoURL}
                                alt={firstName}
                                width={36}
                                height={36}
                                className="rounded-full object-cover"
                            />
                        ) : (
                            <HiOutlineUser className="text-xl" />
                        )}
                    </button>

                    <div className="rounded-md overflow-hidden flex items-center shadow-sm">
                        <Image
                            src="/amazon-now.png"
                            alt="Amazon Now"
                            width={140}
                            height={37}
                            className="object-contain block"
                            priority
                        />
                    </div>

                    <div className="hidden mdl:flex items-center gap-3">
                        <span className="flex items-center gap-1 bg-amazon_yellow text-black text-xs font-bold px-2.5 py-1 rounded-full">
                            <LuZap /> 6 mins
                        </span>
                        <p className="text-sm text-gray-200">
                            Deliver to{" "}
                            <span className="font-semibold text-white">{firstName}</span>
                        </p>
                    </div>

                    <div className="w-9 mdl:hidden" />
                </div>

                <div className="flex mdl:hidden items-center gap-3">
                    <span className="flex items-center gap-1 bg-amazon_yellow text-black text-xs font-bold px-2.5 py-1 rounded-full">
                        <LuZap /> 6 mins
                    </span>
                    <p className="text-sm text-gray-200">
                        Deliver to{" "}
                        <span className="font-semibold text-white">{firstName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 text-gray-500 mdl:max-w-xl mdl:w-full">
                    <HiOutlineSearch className="text-xl shrink-0" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search for atta, milk, fresh fruits…"
                        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 min-w-0"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => onSearchChange("")}
                            aria-label="Clear search"
                            className="text-gray-400 hover:text-gray-600 shrink-0"
                        >
                            <HiX className="text-lg" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NowHeader;
