import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

// Animations
const slideIn = keyframes`
  from { 
    transform: translateX(-10px);
    opacity: 0;
  }
  to { 
    transform: translateX(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(74, 111, 165, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(74, 111, 165, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 111, 165, 0); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-10px);}
  60% {transform: translateY(-5px);}
`;

// Styled Components
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  animation: ${slideIn} 0.5s ease-out;
`;

const SearchInputGroup = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 50px;
  padding: 5px 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid ${props => props.focused ? '#4a6fa5' : '#e0e0e0'};

  &:hover {
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const SearchIcon = styled.div`
  margin-right: 10px;
  color: ${props => props.focused ? '#4a6fa5' : '#9e9e9e'};
  transition: all 0.3s ease;
  animation: ${props => props.focused ? css`${bounce} 0.8s ease` : 'none'};
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 16px;
  background: transparent;
  color: #333;

  &::placeholder {
    color: #9e9e9e;
    transition: all 0.3s ease;
  }

  &:focus::placeholder {
    transform: translateX(5px);
    opacity: 0.7;
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #9e9e9e;
  cursor: pointer;
  padding: 5px;
  margin-left: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transform: ${props => props.visible ? 'scale(1)' : 'scale(0.5)'};
  transition: all 0.3s ease;

  &:hover {
    color: #e74c3c;
    background: rgba(231, 76, 60, 0.1);
    animation: ${pulse} 1s;
  }
`;

const SearchButton = styled.button`
  background: linear-gradient(to right, #4a6fa5, #2c3e50);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 25px;
  margin-left: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(74, 111, 165, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 111, 165, 0.4);
    animation: ${pulse} 1s infinite;
  }

  &:active {
    transform: translateY(0);
  }
`;

const SuggestionsBox = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  margin-top: 5px;
  padding: 10px 0;
  list-style: none;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  transform: ${props => props.show ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
`;

const SuggestionItem = styled.li`
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;

  &:hover {
    background: rgba(74, 111, 165, 0.1);
    color: #4a6fa5;
  }
`;

const NoSuggestions = styled(SuggestionItem)`
  color: #9e9e9e;
  cursor: default;

  &:hover {
    background: transparent;
    color: #9e9e9e;
  }
`;

const SearchBar = ({ 
  value, 
  onChange, 
  onSearch,
  placeholder = 'Search...', 
  suggestions = [],
  showSuggestions = true
}) => {
  const [focused, setFocused] = useState(false);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    setShowClear(value.length > 0);
  }, [value]);

  const handleClear = () => {
    onChange({ target: { value: '' } });
  };

  const handleSuggestionClick = (suggestion) => {
    onChange({ target: { value: suggestion } });
    if (onSearch) onSearch(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <SearchContainer>
      <SearchInputGroup focused={focused}>
        <SearchIcon focused={focused}>
          <i className="bi bi-search"></i>
        </SearchIcon>
        <SearchInput
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyPress={handleKeyPress}
        />
        <ClearButton 
          visible={showClear} 
          onClick={handleClear}
          aria-label="Clear search"
        >
          <i className="bi bi-x-circle"></i>
        </ClearButton>
        <SearchButton onClick={() => onSearch && onSearch(value)}>
          Search
        </SearchButton>
      </SearchInputGroup>

      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsBox show={focused && value.length > 0}>
          {suggestions.map((suggestion, index) => (
            <SuggestionItem 
              key={index} 
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </SuggestionItem>
          ))}
        </SuggestionsBox>
      )}

      {showSuggestions && focused && value.length > 0 && suggestions.length === 0 && (
        <SuggestionsBox show={true}>
          <NoSuggestions>No results found</NoSuggestions>
        </SuggestionsBox>
      )}
    </SearchContainer>
  );
};

export default SearchBar;