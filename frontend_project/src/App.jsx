import {BrowserRouter,Routes,Route} from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SparePart from "./pages/SparePart.jsx";
import StockIn from "./pages/StockIn.jsx";
import StockOut from "./pages/StockOut.jsx";
import Signup from "./pages/Signup.jsx";
import Reports from "./pages/Reports.jsx";
import ActivityLog from "./pages/ActivityLog.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";


function App(){
  return(
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login/>}/>
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard/></Layout>
            </ProtectedRoute>
          }/>

          <Route path="/sparepart" element={
            <ProtectedRoute>
              <Layout><SparePart/></Layout>
            </ProtectedRoute>
          }/>

          <Route path="/stockin" element={
            <ProtectedRoute>
              <Layout><StockIn/></Layout>
            </ProtectedRoute>
          }/>

          <Route path="/stockout" element={
            <ProtectedRoute>
              <Layout><StockOut/></Layout>
            </ProtectedRoute>
          }/>

          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout><Reports/></Layout>
            </ProtectedRoute>
          }/>

          <Route path="/activity" element={
            <ProtectedRoute>
              <Layout><ActivityLog/></Layout>
            </ProtectedRoute>
          }/>
          <Route path="/signup" element={<Signup/>}/>

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App;
