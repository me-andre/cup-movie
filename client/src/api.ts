export interface TvMazeSearchResult {
    score: number;
    show: TvMazeShow;
}

export interface TvMazeShow {
    id: number;
    url: string;
    name: string;
    type: string;
    language: string;
    genres: string[];
    status: string;
    runtime: number | null;
    averageRuntime: number | null;
    premiered: string | null;
    ended: string | null;
    officialSite: string | null;
    schedule: TvMazeSchedule;
    rating: TvMazeRating;
    weight: number;
    network: TvMazeNetwork | null;
    webChannel: TvMazeWebChannel | null;
    dvdCountry: TvMazeCountry | null;
    externals: TvMazeExternals;
    image: TvMazeImage | null;
    summary: string | null;
    updated: number;
    _links: TvMazeLinks;
}

export interface TvMazeSchedule {
    time: string;
    days: string[];
}

export interface TvMazeRating {
    average: number | null;
}

export interface TvMazeNetwork {
    id: number;
    name: string;
    country: TvMazeCountry;
    officialSite: string | null;
}

export interface TvMazeWebChannel {
    id: number;
    name: string;
    country: TvMazeCountry | null;
    officialSite: string | null;
}

export interface TvMazeCountry {
    name: string;
    code: string;
    timezone: string;
}

export interface TvMazeExternals {
    tvrage: number | null;
    thetvdb: number | null;
    imdb: string | null;
}

export interface TvMazeImage {
    medium: string;
    original: string;
}

export interface TvMazeLinks {
    self: TvMazeLinkRef;
    previousepisode?: TvMazeLinkRef;
}

export interface TvMazeLinkRef {
    href: string;
    name?: string;
}

export const getTVShows = async (query: string): Promise<TvMazeSearchResult[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_ROOT_URL}/search/shows?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
        throw new Error(`Error fetching TV shows: ${response.statusText}`);
    }
    const results: TvMazeSearchResult[] = await response.json();
    return results;
};