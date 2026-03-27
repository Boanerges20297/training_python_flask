/*Botão generico que recebe children e uma função onClick */

import styled from 'styled-components';

const Button = ({ children, onClick, disabled }: { children: React.ReactNode, onClick: () => void, disabled?: boolean }) => {
  const baseStyle = "bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 ease-in-out";
  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "";
  const hoverStyle = disabled ? "" : "hover:bg-gray-700 hover:cursor-pointer";

  return (
    <StyledWrapper>
      <button className={`${baseStyle} ${disabledStyle} ${hoverStyle}`} onClick={onClick} disabled={disabled}>
        <div className="content">
          {children}
        </div>
      </button>
    </StyledWrapper>
  );
}

/*A classe content deve alinhar os elementos filhos em linha e centralizados */
const StyledWrapper = styled.div`
  .button svg {
    width: 1.6em;
    display: flex;
    transition: all 0.6s ease;
  }

  .button:hover svg {
    transform: translateX(5px);
  }

  .content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 0 1.5em
  }`;

export default Button;
