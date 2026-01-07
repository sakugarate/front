
export const getTokenFromCookies = (): string => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      if (cookie.trim().startsWith('token=')) {
        return cookie.split('=')[1];
      }
    }
    return '';
  };

  export const getUsernameFromCookies = (): string => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      if (cookie.trim().startsWith('username=')) {
        return cookie.split('=')[1];
      }
    }
    return 'Sign In';
  };


  export const getUserIdFromCookies = (): string => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      if (cookie.trim().startsWith('user_id=')) {
        return cookie.split('=')[1];
      }
    }
    return '';
  };


export const hostUrl = 'http://localhost:8000'//'https://sakurate.art';
