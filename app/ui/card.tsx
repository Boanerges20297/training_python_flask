//Componente de um molde de um card, que pode ser usado em qualquer lugar, recebendo qualquer tipo de informação
'use client';

import styled from 'styled-components';

interface CardProps {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Card({ children, isSelected, onClick, className }: CardProps) {
  const baseStyle = "w-full h-full flex flex-col gap-2 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-100 shadow-lg";
  /*Ao selecionado, ficará com a borda verde escuro e ao deselecionado, ficará com a borda cinza claro*/
  const selectedStyle = "border-2 border-green-600";
  const unselectedStyle = "border-2 border-gray-200";

  return (
    <StyledWrapper>
      <div
        onClick={onClick}
        className={`${baseStyle} ${isSelected ? selectedStyle : unselectedStyle} ${className}`}>
        {children}
      </div>
    </StyledWrapper>
  )
}
/* As estilizações terão quebra de linha para evitar vazamento de conteúdo */
const StyledWrapper = styled.div`
  .card {
    width: 210px;
    padding: .8em;
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
  }

  .card-image {
    background-color: rgb(236, 236, 236);
    width: 100%;
    height: 130px;
    border-radius: 6px 6px 0 0;
    overflow: hidden;
  }

  .card-image:hover {
    transform: scale(0.98);
  }

  .category {
    text-transform: uppercase;
    font-size: 0.7em;
    font-weight: 600;
    color: rgb(63, 121, 230);
    padding: 10px 7px 0;
    overflow: hidden;
  }

  .category:hover {
    cursor: pointer;
  }

  .heading {
    font-weight: 600;
    color: rgb(88, 87, 87);
    padding: 7px;
    overflow: hidden;
  }

  .heading:hover {
    cursor: pointer;
  }

  .author {
    color: gray;
    font-weight: 400;
    font-size: 11px;
    padding-top: 20px;
    overflow: hidden;
  }

  .name {
    font-weight: 600;
  }

  .name:hover {
    cursor: pointer;
  }`;