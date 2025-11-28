/**
 * Error Handler Middleware
 * 
 * Centralized error handling for Express.
 */

export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  
  // Default error status and message
  let status = 500;
  let message = 'Errore interno del server';
  
  // Handle known error types
  if (err.message.includes('non trovata') || 
      err.message.includes('non trovato')) {
    status = 404;
    message = err.message;
  } else if (err.message.includes('già') || 
             err.message.includes('piena') ||
             err.message.includes('deve essere') ||
             err.message.includes('non può') ||
             err.message.includes('Solo') ||
             err.message.includes('Servono')) {
    status = 400;
    message = err.message;
  } else if (err.message.includes('non validi') ||
             err.message.includes('caratteri')) {
    status = 422;
    message = err.message;
  }
  
  res.status(status).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

export default { errorHandler };

