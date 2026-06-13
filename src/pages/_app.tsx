import RootLayout from "@/components/RootLayout";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Provider } from "react-redux";
import { store,persistor } from "@/store/store";
import { PersistGate } from "redux-persist/integration/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
  <div> 
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <div className="bg-gray-300">
            <RootLayout>
              <Component{...pageProps} /> 
            </RootLayout>
          </div>
        </PersistGate>
      </Provider>
  </div>
  );
}
