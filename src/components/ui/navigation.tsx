import React, { useContext } from "react";
import { Button } from "@/components/ui/button";
import { Car, Menu, User, LogOut, Home, MapPin, Phone, Mail, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthContext } from "@/contexts/AuthContext";
import logo from "@/assets/capsulecabs-final-Logo.png"

export const Navigation = () => {
  const { user, isAuthenticated, logout, isLoading } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="border-b border-white/5 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logo} className="h-8 w-40 flex items-center justify-center text-black font-bold text-lg" />
            {/* <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-white text-sm">
                CapsuleCabs
              </span>
              <span className="text-[10px] text-white/60 uppercase tracking-[0.15em]">
                Smart commute
              </span>
            </div> */}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {user?.role === "passenger" && (
              <div className="flex items-center gap-6 text-sm">
                <Link
                  to="/"
                  className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <Link
                  to="/booking"
                  className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
                >
                  <MapPin className="h-4 w-4" />
                  Book Ride
                </Link>
                <Link
                  to="/dashboard"
                  className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-white/10 rounded-full" />
              </div>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-full"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="sm:hidden">Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {user?.email}
                    </p>
                    {user?.phone && (
                      <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {user?.phone}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                    <Link to="/dashboard" className="text-white/80 hover:text-white">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                    <Link to="/bookings" className="text-white/80 hover:text-white">
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-white/10 cursor-pointer text-red-400 hover:text-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-zinc-100 rounded-full"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <>
            {isAuthenticated ? <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                    <Link to="/">Home</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer">
                    <Link to="/booking">Book Ride</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>: ""}
            </>
          </div>
        </div>
      </div>
    </nav>
  );
};
