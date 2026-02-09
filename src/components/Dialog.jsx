import React, { useEffect } from 'react';

/**
 * A reusable Dialog/Modal component that replaces native alerts and inline modals.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {string} props.title - Dialog title
 * @param {React.ReactNode} props.children - Dialog content
 * @param {Array<{label: string, onClick: function, variant?: 'primary'|'danger'|'secondary'|'outline', disabled?: boolean}>} props.actions - Action buttons
 * @param {function} props.onClose - Function to call when closing (overlay click or ESC)
 * @param {boolean} props.preventCloseOnOverlayClick - If true, clicking overlay won't close dialog
 */
const Dialog = ({
    isOpen,
    title,
    children,
    actions = [],
    onClose,
    preventCloseOnOverlayClick = false
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && onClose) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getButtonStyles = (variant, disabled) => {
        const baseStyle = {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: disabled ? 0.6 : 1,
            transition: 'background-color 0.2s',
            minWidth: '80px'
        };

        switch (variant) {
            case 'danger':
                return { ...baseStyle, backgroundColor: '#dc3545', color: 'white' };
            case 'success':
            case 'primary':
                return { ...baseStyle, backgroundColor: '#28a745', color: 'white' };
            case 'info':
                return { ...baseStyle, backgroundColor: '#17a2b8', color: 'white' };
            case 'secondary':
                return { ...baseStyle, backgroundColor: '#6c757d', color: 'white' };
            case 'outline':
                return { ...baseStyle, backgroundColor: 'transparent', border: '1px solid #ddd', color: '#333' };
            default:
                return { ...baseStyle, backgroundColor: '#007bff', color: 'white' };
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => {
                if (!preventCloseOnOverlayClick && onClose && e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '8px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.2s ease-out'
                }}
            >
                {title && (
                    <h2 style={{
                        marginTop: 0,
                        marginBottom: '16px',
                        fontSize: '1.25rem',
                        color: '#333',
                        borderBottom: '1px solid #eee',
                        paddingBottom: '12px'
                    }}>
                        {title}
                    </h2>
                )}

                <div style={{ marginBottom: '24px', lineHeight: '1.5', color: '#444' }}>
                    {children}
                </div>

                {actions.length > 0 && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                        marginTop: 'auto'
                    }}>
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                style={getButtonStyles(action.variant, action.disabled)}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default Dialog;
