-- Covers the composite dish/restaurant relationship and dish lookups.
create index reviews_dish_restaurant_idx on public.reviews(dish_id,restaurant_id);
drop index public.reviews_dish_idx;
