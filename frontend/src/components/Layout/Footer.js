import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-8px);}
  60% {transform: translateY(-4px);}
`;

// Styled Components
const FooterContainer = styled.footer`
  background: linear-gradient(to right, #2c3e50, #4a6fa5);
  color: white;
  padding: 40px 0 20px;
  margin-top: auto;
  animation: ${fadeIn} 0.8s ease-out;
  
  /* Responsive padding */
  @media (max-width: 1200px) {
    padding: 35px 0 15px;
  }
  
  @media (max-width: 768px) {
    padding: 30px 0 10px;
  }
  
  @media (max-width: 576px) {
    padding: 25px 0 5px;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  
  /* Responsive adjustments */
  @media (max-width: 992px) {
    gap: 25px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 25px;
    padding: 0 15px;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  
  h4 {
    margin-bottom: 20px;
    position: relative;
    padding-bottom: 10px;
    font-size: 1.25rem;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 50px;
      height: 2px;
      background: linear-gradient(to right, #3498db, #2ecc71);
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    h4 {
      margin-bottom: 15px;
      font-size: 1.2rem;
    }
  }
  
  @media (max-width: 576px) {
    text-align: center;
    
    h4::after {
      left: 50%;
      transform: translateX(-50%);
    }
  }
`;

const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-bottom: 12px;
  }
  
  a {
    color: #ecf0f1;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      color: #3498db;
      transform: translateX(5px);
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 576px) {
    a {
      justify-content: center;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 15px;
  
  /* Responsive adjustments */
  @media (max-width: 576px) {
    justify-content: center;
  }
`;

const SocialIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.color || '#3498db'};
    transform: translateY(-5px);
    animation: ${bounce} 0.8s ease;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const ContactInfo = styled.div`
  p {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 576px) {
    p {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
`;

const NewsletterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 15px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    padding: 10px 12px;
  }
`;

const Button = styled.button`
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  background: linear-gradient(to right, #3498db, #2ecc71);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    animation: ${pulse} 1s;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    padding: 10px 15px;
    font-size: 14px;
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 40px auto 0;
  padding: 20px 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  
  /* Responsive adjustments */
  @media (max-width: 992px) {
    margin-top: 30px;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 15px 20px 0;
    margin-top: 25px;
  }
  
  @media (max-width: 576px) {
    padding: 15px 15px 0;
    gap: 15px;
  }
`;

const Copyright = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const LegalLinks = styled.div`
  display: flex;
  gap: 20px;
  
  a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.3s ease;
    font-size: 14px;
    
    &:hover {
      color: white;
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    gap: 15px;
  }
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const BackToTop = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(to right, #3498db, #2ecc71);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transform: translateY(${props => props.visible ? 0 : '20px'});
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-5px);
    animation: ${bounce} 0.8s ease;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    width: 45px;
    height: 45px;
  }
  
  @media (max-width: 576px) {
    bottom: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
  }
`;

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      // In a real application, you would send this to your backend
      console.log('Subscribed with email:', email);
      setSubscribed(true);
      setEmail('');
      
      // Reset subscription message after 3 seconds
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <>
      <FooterContainer>
        <FooterContent>
          <FooterSection>
            <h4>Inventory Management System</h4>
            <p>Streamlining your inventory processes with powerful management tools and real-time analytics.</p>
            <SocialLinks>
              <SocialIcon color="#3b5998" href="#" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </SocialIcon>
              <SocialIcon color="#1da1f2" href="#" aria-label="Twitter">
                <i className="bi bi-twitter"></i>
              </SocialIcon>
              <SocialIcon color="#0077b5" href="#" aria-label="LinkedIn">
                <i className="bi bi-linkedin"></i>
              </SocialIcon>
              <SocialIcon color="#e4405f" href="#" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </SocialIcon>
            </SocialLinks>
          </FooterSection>
          
          <FooterSection>
            <h4>Quick Links</h4>
            <FooterLinks>
              <li><a href="#"><i className="bi bi-arrow-right"></i> Dashboard</a></li>
              <li><a href="#"><i className="bi bi-arrow-right"></i> Products</a></li>
              <li><a href="#"><i className="bi bi-arrow-right"></i> Orders</a></li>
              <li><a href="#"><i className="bi bi-arrow-right"></i> Suppliers</a></li>
              <li><a href="#"><i className="bi bi-arrow-right"></i> Reports</a></li>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <h4>Contact Us</h4>
            <ContactInfo>
              <p><i className="bi bi-geo-alt"></i> 123 Business Ave, Suite 100</p>
              <p><i className="bi bi-telephone"></i> +1 (555) 123-4567</p>
              <p><i className="bi bi-envelope"></i> support@inventoryapp.com</p>
            </ContactInfo>
          </FooterSection>
          
          <FooterSection>
            <h4>Newsletter</h4>
            <p>Subscribe to our newsletter for updates and feature announcements.</p>
            <NewsletterForm onSubmit={handleSubscribe}>
              <InputGroup>
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit">Subscribe</Button>
              </InputGroup>
              {subscribed && <p style={{color: '#2ecc71', marginTop: '10px', textAlign: 'center', fontSize: '14px'}}>Thank you for subscribing!</p>}
            </NewsletterForm>
          </FooterSection>
        </FooterContent>
        
        <FooterBottom>
          <Copyright>
            &copy; {new Date().getFullYear()} Inventory Management System. All rights reserved.
          </Copyright>
          <LegalLinks>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </LegalLinks>
        </FooterBottom>
      </FooterContainer>
      
      <BackToTop 
        visible={showBackToTop} 
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <i className="bi bi-arrow-up"></i>
      </BackToTop>
    </>
  );
};

export default Footer;