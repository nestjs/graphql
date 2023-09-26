export interface BookDocument {
  id: string;
  title: string;
  authorId: string;
  unitsSold: number;
}

export interface AuthorDocument {
  id: string;
  name: string;
  penName: string;
  contracted: boolean;
  salary?: number;
}

const authors: AuthorDocument[] = [
  {
    id: 'A001',
    name: 'Roger Kevin Barker',
    penName: 'R. K. Barkley',
    contracted: true,
    salary: 1000,
  },
  {
    id: 'A002',
    name: 'Joshua Tommy MacDonald',
    penName: 'J. T. MacKenzie',
    contracted: false,
  },
  {
    id: 'A003',
    name: 'Hannah Rachel Smart',
    penName: 'Kitty Rachels',
    contracted: true,
    salary: 5000,
  },
  {
    id: 'A004',
    name: 'Cuthbert Simon Kowalski',
    penName: 'Colin S. Murderer',
    contracted: true,
    salary: 3000,
  },
  {
    id: 'A005',
    name: 'Morwenna Molly Noris',
    penName: 'Noris Morblood',
    contracted: false,
  },
];

const books: BookDocument[] = [
  {
    id: 'B001',
    authorId: 'A001',
    title: 'Invader Of Dreams',
    unitsSold: 10,
  },
  {
    id: 'B002',
    authorId: 'A001',
    title: 'Nymph Of Darkness',
    unitsSold: 10,
  },
  {
    id: 'B003',
    authorId: 'A002',
    title: 'Foreigners Of The Prison',
    unitsSold: 5,
  },
  {
    id: 'B004',
    authorId: 'A003',
    title: 'Blacksmiths With vigor',
    unitsSold: 40,
  },
  {
    id: 'B005',
    authorId: 'A003',
    title: 'Witches And Doctors',
    unitsSold: 60,
  },
  {
    id: 'B006',
    authorId: 'A003',
    title: 'Gods And Doctors',
    unitsSold: 20,
  },
  {
    id: 'B007',
    authorId: 'A004',
    title: 'Star Of The Forest',
    unitsSold: 85,
  },
  {
    id: 'B008',
    authorId: 'A004',
    title: 'Termination With Wings',
    unitsSold: 15,
  },
  {
    id: 'B009',
    authorId: 'A005',
    title: 'Bathing In The Moon',
    unitsSold: 25,
  },
  {
    id: 'B010',
    authorId: 'A005',
    title: 'Sounds In The Slaves',
    unitsSold: 55,
  },
];

export function getAllBooks() {
  return books;
}

export function getAllAuthors() {
  return authors;
}
