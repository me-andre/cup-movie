import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { getTVShows, type TvMazeSearchResult } from './api.ts';
import { Box, CircularProgress, InputAdornment, InputLabel, List, ListItemText, TextField } from '@mui/material';
import { debounce, uniqBy } from 'lodash';
import { MovieCard } from './MovieCard.tsx';
import { SelectableListItem } from './SelectableListItem.tsx';

const uncategorized = Symbol.for('Uncategorized');

enum CurrentResultsType {
    FullMatch,
    LongerMatch,
    ShorterMatch,
    NoMatch,
}

type CurrentResults =
    | { type: CurrentResultsType.FullMatch, results: TvMazeSearchResult[] }
    | { type: CurrentResultsType.LongerMatch, results: TvMazeSearchResult[] }
    | { type: CurrentResultsType.ShorterMatch, results: TvMazeSearchResult[] }
    | { type: CurrentResultsType.NoMatch, results: null };

const findShorterMatch = <V,>(cache: Record<string, V>, key: string) => {
    if (key.length <= 1) {
        return null;
    }
    for (let i = 0; i < key.length - 1; i++) {
        const shorterKey = key.slice(0, key.length - i - 1);
        if (cache[shorterKey]) {
            return cache[shorterKey];
        }
    }
    return null;
};

function App() {
    const [searchTerm, setSearchTerm] = useState('');

    const trimmedSearchTerm = useMemo(() => searchTerm.trim(), [searchTerm]);

    const [searchResults, setSearchResults] = useState<Record<string, TvMazeSearchResult[]>>(Object.create(null));

    const debouncedFetch = useRef(debounce(async (searchTerm: string) => {
        const results = await getTVShows(searchTerm);

        setSearchResults(prevResults => ({
            ...prevResults,
            [searchTerm]: results,
        }));

    }, parseInt(import.meta.env.VITE_SEARCH_DELAY) || 0)).current;

    useEffect(() => {
        debouncedFetch(trimmedSearchTerm);
    }, [debouncedFetch, trimmedSearchTerm]);

    const currentResults = useMemo((): CurrentResults => {
        // There are results for the exact given term
        if (searchResults[trimmedSearchTerm]) {
            return {
                type: CurrentResultsType.FullMatch,
                results: searchResults[trimmedSearchTerm],
            };
        }

        const keys = Object.keys(searchResults);

        if (keys.length === 0) {
            return {
                type: CurrentResultsType.NoMatch,
                results: null,
            };
        }

        const longerMatches = keys.filter(key => key.startsWith(trimmedSearchTerm));

        // Results for a longer search term are subset of results for the current search term,
        // we can render them and give the user a hint the broader results are still being loaded
        if (longerMatches.length > 0) {
            return {
                type: CurrentResultsType.LongerMatch,
                results: uniqBy(longerMatches.flatMap(key => searchResults[key]), 'show.id'),
            };
        }

        const shorterMatch = findShorterMatch(searchResults, trimmedSearchTerm);

        // Results for a shorter search term are superset of results for the current search term,
        // we can render them in a non-interactive way to improve perceptual responsiveness
        if (shorterMatch) {
            return {
                type: CurrentResultsType.ShorterMatch,
                results: shorterMatch,
            };
        }

        return {
            type: CurrentResultsType.NoMatch,
            results: null,
        };
    }, [searchResults, trimmedSearchTerm]);

    const genredShows = useMemo(() => {
        const genres: Map<string | typeof uncategorized, TvMazeSearchResult[]> = new Map();

        currentResults.results?.forEach(show => {
            if (show.show.genres.length > 0) {
                show.show.genres.forEach(genre => {
                    if (!genres.has(genre)) {
                        genres.set(genre, []);
                    }
                    genres.get(genre)!.push(show);
                });
            } else {
                if (!genres.has(uncategorized)) {
                    genres.set(uncategorized, []);
                }
                genres.get(uncategorized)!.push(show);
            }
        });

        return genres;
    }, [currentResults]);

    const [selectedGenre, setSelectedGenre] = useState<string | typeof uncategorized | null>(null);

    const onGenreChange = (genre: string | typeof uncategorized) => {
        setSelectedGenre(genre);
    };

    const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

    const onShowChange = (show: TvMazeSearchResult) => {
        setSelectedShowId(show.show.id);
    };

    const displayedResult = useMemo(() => {
        // Lazily unselecting the show if it doesn't fall into the selected genre
        // Imperatively doing this could be simpler, but keeping user selection often is better UX
        if (!selectedShowId || !currentResults.results) {
            return null;
        }
        const show = currentResults.results.find(show => show.show.id === selectedShowId);
        if (!show) {
            return null;
        }
        if (!selectedGenre) {
            return show;
        }
        if (show.show.genres.length === 0 && selectedGenre !== uncategorized) {
            return null;
        }
        if (show.show.genres.length > 0 && !show.show.genres.includes(selectedGenre as string)) {
            return null;
        }
        return show;
    }, [selectedShowId, selectedGenre, currentResults]);

    const isLoading = trimmedSearchTerm && currentResults.type !== CurrentResultsType.FullMatch;

    return (
        <Box
            flex={1}
            display="flex"
            flexDirection="row"
            justifyContent="start"
            alignItems="start"
            padding={2}
            gap={2}
            alignSelf="stretch"
        >
            <Box flex="1 1 0">
                <TextField
                    value={searchTerm}
                    label="Search by title"
                    fullWidth
                    onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    {isLoading ? <CircularProgress size={24} /> : null}
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Box flex={1} display="flex" flexWrap="wrap">
                    <Box flex="0 0 50%" padding={2} minWidth={({ spacing }) => spacing(20)}>
                        <InputLabel>
                            Genres
                        </InputLabel>
                        <List sx={{ flex: '1 0 0' }}>
                            {genredShows && genredShows.size > 0 && Array.from(genredShows.keys()).map((genre) => (
                                <SelectableListItem
                                    key={genre === uncategorized ? '__uncategorized__' : genre}
                                    disabled={currentResults.type === CurrentResultsType.ShorterMatch}
                                    onClick={() => onGenreChange(genre)}
                                    selected={selectedGenre === genre}
                                >
                                    <ListItemText primary={genre === uncategorized ? 'Uncategorized' : genre} />
                                </SelectableListItem>
                            ))}
                        </List>
                    </Box>
                    <Box flex="0 0 50%" padding={2} minWidth={({ spacing }) => spacing(20)}>
                        <InputLabel>
                            Shows
                        </InputLabel>
                        {genredShows && selectedGenre && genredShows.has(selectedGenre) && (
                            <List>
                                {genredShows.get(selectedGenre)!.map((result) => (
                                    <SelectableListItem
                                        key={result.show.id}
                                        onClick={() => onShowChange(result)}
                                        selected={displayedResult?.show.id === result.show.id}
                                    >
                                        <ListItemText primary={result.show.name} />
                                    </SelectableListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                </Box>
            </Box>
            <MovieCard show={displayedResult?.show} />
        </Box>
    )
}

export default App;
