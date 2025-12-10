
import React from 'react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  
  const navItemClass = (view: ViewState) => 
    `cursor-pointer px-2 md:px-4 py-2 text-xs md:text-sm font-medium transition-all tracking-wide whitespace-nowrap ${
      currentView === view 
        ? 'text-solar-gold border-b-2 border-solar-gold' 
        : 'text-white/80 hover:text-white hover:border-b-2 hover:border-white/30'
    }`;

  return (
    <nav className="bg-solar-green shadow-lg sticky top-0 z-50 border-b border-white/10 py-3">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          
          {/* Linha 1: Logomarca Centralizada */}
          <div className="flex items-center cursor-pointer mb-3 md:mb-4 group" onClick={() => onNavigate(ViewState.HOME)}>
            <img 
              src="/hotel-solar-logo.png" 
              alt="Hotel Solar" 
              className="h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {/* Linha 2: Menu Horizontal (Sempre Visível) */}
          <div className="w-full flex items-center justify-center">
            <div className="flex items-center gap-1 md:gap-4 overflow-x-auto pb-1 no-scrollbar max-w-full">
              <a 
                href="https://www.hotelsolar.tur.br/"
                className="cursor-pointer px-2 md:px-4 py-2 text-xs md:text-sm font-medium transition-all tracking-wide whitespace-nowrap text-white/80 hover:text-white hover:border-b-2 hover:border-white/30"
              >
                VOLTAR PARA SITE
              </a>
              <button onClick={() => onNavigate(ViewState.HOME)} className={navItemClass(ViewState.HOME)}>INÍCIO</button>
              <button onClick={() => onNavigate(ViewState.ROOMS)} className={navItemClass(ViewState.ROOMS)}>ACOMODAÇÕES</button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;