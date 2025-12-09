
import React from 'react';
import { Sun } from 'lucide-react';
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
            <div className="bg-gradient-to-br from-solar-gold to-yellow-600 rounded-full p-1.5 mr-3 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-500">
              <Sun className="h-5 w-5 md:h-6 md:w-6 text-solar-green" />
            </div>
            <div className="flex flex-col justify-center items-center">
              <span className="font-serif font-bold text-2xl md:text-3xl text-solar-gold tracking-[0.2em] leading-none">SOLAR</span>
            </div>
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
              <button onClick={() => onNavigate(ViewState.PACKAGES)} className={navItemClass(ViewState.PACKAGES)}>PACOTES</button>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;