

export type RatingValue = 'garbage' |  'broken' | 'weak'  | 'inconsistent' | 'whatever' | 'acceptable' | 'solid' | 'stunning' | 'generational'
export const colors: Record<RatingValue, string> = {
    'garbage': '#ff0000',
    'weak': '#EE4B2B',
    'broken': '#FFAC1C',
    'inconsistent': '#ffcc00',
    'whatever': '#ffff00',
    'acceptable': '#ccff66',
    'solid': '#99ff33',
    'stunning': '#66ff99',
    'generational': '#00ffff',
}
export const getRatingColor = (value: RatingValue): string => {
    return colors[value]
}
export const getRatingColorFromStr = (value: string): string => {
    const match = value.match(/\(([^)]+)\)/);
    
    if (match && match[1]) {
        const rating = numsToRatingOpts[Math.floor(match[1])]
        console.log(rating)
        return colors[rating] || '#FFAC1C'
    }
    return ''
};
export const getRatingColorFromFloat = (value: number): string => {
    const rating = numsToRatingOpts[Math.floor(value)]
    console.log(rating)
    return colors[rating] || '#FFAC1C'
};
export const ratingOptionsToNums = {
    'garbage': 1,
    'weak': 2,
    'broken': 3,
    'inconsistent': 4,
    'whatever': 5,
    'acceptable': 6,
    'solid': 7,
    'stunning': 8,
    'generational': 9,
  }
const numsToRatingOpts = {
    1: 'garbage',
    2: 'weak',
    3: 'broken',
    4: 'inconsistent',
    5: 'whatever',
    6: 'acceptable',
    7: 'solid',
    8: 'stunning',
    9: 'generational'
  }
export const ratingOptions: RatingValue[] = ['garbage', 'broken', 'weak',  'inconsistent', 'whatever', 'acceptable', 'solid', 'stunning', 'generational']

