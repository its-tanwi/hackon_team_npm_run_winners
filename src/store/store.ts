import { configureStore } from '@reduxjs/toolkit'
import nextReducer from "./nextSlice";
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
  } from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'

// Create a noop storage for server-side rendering
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null)
    },
    setItem(_key: string, _value: any) {
      return Promise.resolve(_value)
    },
    removeItem() {
      return Promise.resolve()
    },
  }
}

// Use noop storage on server, regular storage on client
const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage()

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
}

const persistedReducer = persistReducer(persistConfig, nextReducer)

export const store = configureStore({
    reducer: {next:persistedReducer},
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
});

export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch