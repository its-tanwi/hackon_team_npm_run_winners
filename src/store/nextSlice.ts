import { createSlice } from "@reduxjs/toolkit";
import { StoreProduct } from "@/type";

interface NextState{
    productData: StoreProduct[],
    favoriteData:StoreProduct[],
    allProducts:StoreProduct[],
    userInfo: null | string;
    searchTerm: string;
    filteredProducts: StoreProduct[];
}

const initialState:NextState = {
    productData : [],
    favoriteData : [],
    allProducts : [],
    userInfo: null,
    searchTerm: '',
    filteredProducts: [],

};

export const nextSlice = createSlice({
    name: 'next',
    initialState,
    reducers : {
        addToCart : (state, action) => {
            const existingProduct = state.productData.find(
                (item: StoreProduct) => item.id === action.payload.id
            );
            if(existingProduct){
                existingProduct.quantity += action.payload.quantity
            }else{
                state.productData.push(action.payload)
            }
        },
        addToFavorite:(state,action) =>{
            const existingProduct = state.favoriteData.find(
                (item: StoreProduct) => item.id === action.payload.id
            );
            if(existingProduct){
                existingProduct.quantity += action.payload.quantity
            }else{
                state.favoriteData.push(action.payload)
            }
        },
        increaseQuantity:(state,action) => {
            const existingProduct = state.productData.find(
                (item: StoreProduct) => item.id === action.payload.id
            );
            if (existingProduct) {
  existingProduct.quantity++;
}
;
        },
        decreaseQuantity:(state,action) =>{
            const existingProduct = state.productData.find(
                (item: StoreProduct) => item.id === action.payload.id
            );
            if(existingProduct?.quantity === 1){
                existingProduct.quantity = 1;
            }else{
                if (existingProduct) {
  existingProduct.quantity--;
}
;
            }
        },
        deleteProduct:(state,action) => {
            state.productData = state.productData.filter(
                (item)=>item.id !== action.payload
            );
        },
        resetCart:(state) => {
            state.productData = [];
        },
        addUser:(state,action) => {
            state.userInfo = action.payload
        },
        removeUser:(state) =>{
            state.userInfo = null;
        },
        setAllProducts: (state,action) => {
            state.allProducts = action.payload;
        },
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
        },
        filterProducts: (state, action) => {
            const searchTerm = action.payload.toLowerCase();
            if (searchTerm === '') {
                state.filteredProducts = [];
            } else {
                state.filteredProducts = state.allProducts.filter(product =>
                    product.title.toLowerCase().includes(searchTerm) ||
                    product.category.toLowerCase().includes(searchTerm) ||
                    (product.brand && product.brand.toLowerCase().includes(searchTerm))
                );
            }
        },
        clearSearch: (state) => {
            state.searchTerm = '';
            state.filteredProducts = [];
        },
    },

});

export const {addToCart,addToFavorite,increaseQuantity,decreaseQuantity,deleteProduct,
    resetCart, addUser, removeUser, setAllProducts, setSearchTerm, filterProducts, clearSearch
} = nextSlice.actions;
export default nextSlice.reducer;